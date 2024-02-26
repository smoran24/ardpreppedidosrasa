sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/Button",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	"sap/ui/model/SimpleType",
	"sap/ui/model/ValidateException",
	'AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Utils'
], function (Controller, Dialog, Label, Button, MessageBox, MessageToast, MessagePopover, MessageItem, Link, JSONModel, Filter,
	SimpleType, ValidateException, Utils) {
	"use strict";
	var oView, generar = [],
		generar2, t, oSelectedItem, cliente, pedido, destino, datos, oUsuariosap, codigoeliminar, org, flagperfil;
	var msext = [];
	var superarr = [];
	var oMessagePopover;
	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.CrearPedidoVerificado", {

		onInit: function () {
			var oRouter =
				sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("verificado").attachMatched(this._onRouteMatched, this);
			t = this;
			oView = this.getView();
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this._oDataHanaModel = this.getOwnerComponent().getModel("ODataHana");
			//
			t.popupmensaje();
			
			//	t.DemandaPerdidaConsulta();
		},
		apemod: function (msext) {
			generar2 = msext;
			// this.integrar();
		},
		_onRouteMatched: function (oEvent) {

			var oArgs = oEvent.getParameter("arguments");

			var dataV = JSON.parse(oArgs.data);
			//INICIO
			if (!Array.isArray(dataV.HeaderSet.Header.Nav_Header_Stock_2.Stock)) {
				generar.push(dataV.HeaderSet.Header.Nav_Header_Stock_2.Stock);
			} else {
				generar = dataV.HeaderSet.Header.Nav_Header_Stock_2.Stock;
			}
			//FIN

			for (var i = 0; i < generar.length; i++) {
				t.ConsultaMaterial2(generar[i].Material);
			}

			t.integrar();

		},
		jsonnn: function (a, b, c) {
			cliente = a;
			pedido = b;
			destino = c;

		},
		jsoncreacion: function (xa, a, b, c, d, e, f) {
			oUsuariosap = xa;
			cliente = a;
			pedido = b;
			destino = c;
			datos = d;
			org = e;
			flagperfil = f;
		
		},

		ConsultaMaterial2: function (num) {
			var key = num;
			var material = '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata/material?$top=600&$filter=startswith(MATERIAL,%27' + key +
				'%27)';
                var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
                var appModulePath = jQuery.sap.getModulePath(appid);
			//Consulta
			$.ajax({
				type: 'GET',
				url:appModulePath + material,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: false,
				success: function (dataR, textStatus, jqXHR) {

					if (dataR.d.results.length !== 0) {
						var json = {
							"Material": dataR.d.results[0].MATERIAL,
							"DESCRIPCION": dataR.d.results[0].DESCRIPCION,
							"CANTMIN": dataR.d.results[0].CANTMIN,
							"MVENTA": dataR.d.results[0].MVENTA
						};

				
						msext.push(json);
					}
			
					var material = new sap.ui.model.json.JSONModel(msext);
					oView.setModel(material, "validos");

				},
				error: function (jqXHR, textStatus, errorThrown) {

				}
			});
		},
		popupmensaje: function (unicosNeExTemp) {
			var arr = [];
			var json = {
				"Material": unicosNeExTemp

			};
			arr.push(json);

			var listanegra = new sap.ui.model.json.JSONModel(unicosNeExTemp);
			oView.setModel(listanegra, "listaNegra");

			var oLink = new Link({
				text: "Show more information",
				href: "http://sap.com",
				target: "_blank"
			});

			t.ocultar();
			var oMessageTemplate = new MessageItem({
				type: '{type}',
				title: '{title}',
				activeTitle: "{active}",
				description: '{description}',
				subtitle: '{subtitle}',
				counter: '{counter}',
				link: oLink
			});

			var sErrorDescription = [];
			for (var i = 0; i < listanegra.oData.length; i++) {
				var cod = listanegra.oData[i].Material;
				var men = listanegra.oData[i].Mensaje;
				var json2 = men;

				sErrorDescription.push(json2);

			}
			var arrjson = JSON.stringify(sErrorDescription);
			arrjson.replace(/\,/g, "\n");
			// arrjson.replace(/\]/g, "");
			// arrjson.replace(/\{/g, "");
			// arrjson.replace(/\}/g, "");

			oMessagePopover = new MessagePopover({
				items: {
					path: '/',
					template: oMessageTemplate
				}
				//,
				// activeTitlePress: function () {
				// 	MessageToast.show('Active title is pressed');
				// }
			});

			var aMockMessages = [{
				//	type: 'Error',
				title: 'Materiales Rechazados',
				active: true,
				description: arrjson,
				subtitle: '',
				counter: listanegra.oData.length
			}, {
				type: 'Error',
				title: 'Materiales Rechazados',
				description: arrjson,
				counter: listanegra.oData.length
			}];

			var oModel = new JSONModel();
			oModel.setData(aMockMessages);
			this.getView().setModel(oModel);
			//	this.byId("messagePopoverBtn").addDependent(oMessagePopover);
		},
		ocultar: function () {
			var json = oView.getModel("listaNegra");
		
			if (json === undefined || json.oData.length === 0) {
				oView.byId("malos").setVisible(false);
				//89
			} else {
				oView.byId("malos").setVisible(true);
			}
		},
		handleValueHelp: function (oEvent) {
			//	var sInputValue = oEvent.getSource().getValue();

			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.PopUpdescartadosStock",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}

			this._valueHelpDialog.open();
		},

		_handleValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		cerrarpopmalos: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);

		},
		EnvioCorreo: function (evt) {
			var oSelectedItem2 = evt.getParameter("selectedItem").oBindingContexts.listaNegra.sPath;

			oSelectedItem2 = oSelectedItem2.replace(/\//g, "");

			//	t.cerrarpopmalos();
			var oDialog = oView.byId("EnvioCorreo");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Correo", this);
				oView.addDependent(oDialog);
			}
			oDialog.open();
			t.infocorreo(oSelectedItem2);
			//	oView.byId("textCarga").setText(titulo);
		},
		infocorreo: function (oSelectedItem2) {
			var json = oView.getModel("listaNegra").oData;

			oView.byId("materialess").setValue(json[oSelectedItem2].Material);
		},
		_validateInput: function (oInput) {

			var oBinding = oInput.getBinding("value");
			var sValueState = "None";
			var bValidationError = false;

			try {
				oBinding.getType().validateValue(oInput.getValue());
			} catch (oException) {
				sValueState = "Error";
				bValidationError = true;
			}

			oInput.setValueState(sValueState);

			return bValidationError;
		},
		estructura: function () {
			// attach handlers for validation errors
			sap.ui.getCore().getMessageManager().registerObject(this.oView.byId("materialess"), true);
			sap.ui.getCore().getMessageManager().registerObject(this.oView.byId("descrpcion"), true);
			sap.ui.getCore().getMessageManager().registerObject(this.oView.byId("Vin"), true);
			codigoeliminar = oView.byId("materialess").getValue();
			var descripcion = oView.byId("descrpcion").getValue();
			var Vin = oView.byId("Vin").getValue();
			if (codigoeliminar === "" || descripcion === "" || Vin === "") {

				MessageBox.alert("Los Campos Referencia, Descripción y Vin son Obligatorios");

			} else {

				var solicitante = oUsuariosap;
				var correo;
                var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
                var appModulePath = jQuery.sap.getModulePath(appid);
				var url = '/destinations/IDP_Nissan/service/scim/Users/' + oUsuariosap;
				//Consulta
				$.ajax({
					type: 'GET',
					url:appModulePath + url,
					contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					async: false,
					success: function (dataR, textStatus, jqXHR) {

						correo = dataR.emails[0].value;
						var contexto =
							"<table><tr><td class= subhead >Solicitud -<b> creación de material en SAP</b><p></td></tr><p><tr><td class= h1> Soporte,  Desde el portal de Dealer Portal," +
							"se levanta un ticket para la creación de un nuevo material SAP, con las siguientes características :  <p><b>Código Material: " +
							codigoeliminar + "</b><p><b>Descripción : " + descripcion + "</b> <p><b>Numero Vin : " + Vin +
							"</b> <p> El solicitante de este requerimiento es el usuario:<b>" +
							solicitante +
							"</b><p><b> Mail: " + correo + " </b><p>" +
							"Saludos <p> Dealer Portal Argentina </td> </tr> </table>";

						t.envio(contexto);
					},
					error: function (jqXHR, textStatus, errorThrown) {

					}
				});
			}
		},
		cerrarEnvioCorreo: function () {
			t.limpiezacorreo();
			oView.byId("EnvioCorreo").close();
		},

		envio: function (contexto) {
			t.popCarga();
			var arr = [];
			var json = {
				"root": {
					"strmailto": "repuestos.soporte@nissan.com.ar",
					"strmailcc": "",
					"strsubject": "Solicitud de Material",
					"strbody": contexto
				}
			};
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			var arrjson = JSON.stringify(json);
			$.ajax({
				type: 'POST',
				url:appModulePath + '/destinations/AR_DP_DEST_CPI/http/AR/DealerPortal/Mail',
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: true,
				data: arrjson,
				success: function (dataR, textStatus, jqXHR) {
					var json = oView.getModel("listaNegra").oData;
					for (var i = 0; i < json.length; i++) {
						if (json.Material !== codigoeliminar) {
							var json2 = {
								"CantPed": json[i].CantPed,
								"Recargo": json[i].Recargo,
								"TipoMensaje": json[i].TipoMensaje,
								"PrecioVenta": json[i].PrecioVenta,
								"Mensaje": json[i].Mensaje,
								"PrecioFinal": json[i].PrecioFinal,
								"CantAsig": json[i].CantAsig,
								"Descuento": json[i].Descuento,
								"Material": json[i].Material,
								"Cliente": json[i].Cliente,
								"Precio": json[i].Precio
							};
							arr.push(json2);
						}
					}
					var listanegra = new sap.ui.model.json.JSONModel(arr);
					oView.setModel(listanegra, "listaNegra");
					t.cerrarPopCarga2();
					var obj2 = {
						codigo: "200",
						descripcion: "Correo enviado exitosamente"
					};
					var arr2 = [];
					arr2.push(obj2);
					t.popSuccesCorreo(arr2, "Pedido Creado Exitosamente");

				},
				error: function (jqXHR, textStatus, errorThrown) {
					var json3 = oView.getModel("listaNegra").oData;
					for (var i = 0; i < json3.length; i++) {
						if (json3[i].Material !== codigoeliminar) {
							var json2 = {
								"CantPed": json3[i].CantPed,
								"Recargo": json3[i].Recargo,
								"TipoMensaje": json3[i].TipoMensaje,
								"PrecioVenta": json3[i].PrecioVenta,
								"Mensaje": json3[i].Mensaje,
								"PrecioFinal": json3[i].PrecioFinal,
								"CantAsig": json3[i].CantAsig,
								"Descuento": json3[i].Descuento,
								"Material": json3[i].Material,
								"Cliente": json3[i].Cliente,
								"Precio": json3[i].Precio
							};
							arr.push(json2);
						}
					}
					var listanegra = new sap.ui.model.json.JSONModel(arr);
					oView.setModel(listanegra, "listaNegra");
					if (listanegra.oData.length === 0 || listanegra === undefined) {
						oView.byId("malos").setVisible(false);
					}
					t.cerrarPopCarga2();

					var obj2 = {
						codigo: "200",
						descripcion: "Correo enviado exitosamente"
					};
					var arr2 = [];
					arr2.push(obj2);
					t.popSuccesCorreo(arr2, "Pedido Creado Exitosamente");
				}
			});
			//	codigoeliminar = "";
		},
		mensaje: function () {
			sap.ui.require(["sap/m/MessageToast"], function (oMessage) {
				oMessage.show("Cantidad Modificada por minimo o multiplo");
			});
		},

		getUnicos: function (jsonIn) {
			var flagT = true,
				unicosT2 = [],
				jsonInT = [];
			if (!Array.isArray(generar)) {
				jsonInT.push(jsonIn);
			} else {
				jsonInT = jsonIn;
			}
			for (var i = 0; i < jsonInT.length; i++) {
				for (var j = 0; j < unicosT2.length; j++) {
					if (jsonInT[i].Material === unicosT2[j].Material) {
						flagT = false;
					}
				}
				if (flagT) {
					unicosT2.push(jsonInT[i]);
				}
				flagT = true;
			}
			return unicosT2;
		},
		validaVIN: function () {
			var arr = [];
		
			if (oView.byId("Vin").getValue().length < 17 || oView.byId("Vin").getValue().length > 17) {
				var obj = {
					codigo: "01",
					descripcion: "El campo VIN debe ser de 17 caracteres  "
				};
				arr.push(obj);

				t.popError3(arr, "Ingreso VIN");
				oView.byId("Vin").setValue();
			}

		},
		integrar: function () {
			var color;
			var ncolor;
			var flag = true;
			var unicosNeExTemp = []; //unicos no existen
			if (oView.getModel("validos") === undefined) {
				unicosNeExTemp = t.getUnicos(generar);

			} else {
				var json2 = oView.getModel("validos").oData;

				var unicosExT = [], //Unicos que existen
					unicosTotTem = []; //Unicos totales
				unicosExT = t.getUnicos(json2);

				unicosTotTem = t.getUnicos(generar);

				for (var i = 0; i < unicosTotTem.length; i++) {
					if (unicosTotTem[i].TipoMensaje === "E") {
						for (var k = 0; k < unicosNeExTemp.length; k++) {
							if (unicosNeExTemp[k].Material === unicosTotTem[i].Material) {
								flag = false;
							}
						}
						if (flag) {
							unicosNeExTemp.push(unicosTotTem[i]);
						}
					}
					flag = true;
				}
			
				//desde aqui
				for (var q = 0; q < org.length; q++) {
					for (var p = 0; p < unicosTotTem.length; p++) {
						if (org[q].Material === unicosTotTem[p].Material) {
							flag = false;
						
						}
					}
					if (flag && org[q].Cliente === "") {
						unicosNeExTemp.push({
							Material: org[q].Material,
							Mensaje: "Codigo Material Descontinuado o NO existente "
						});
					}
					flag = true;
				}
				//hasta aqui
				var arr3 = [],
					arr4 = generar,
					suma = 0,
					posT = -1,
					matT = "";
				for (var i = 0; i < unicosExT.length; i++) {
					for (var j = 0; j < generar.length; j++) {
						if (unicosExT[i].Material === generar[j].Material && (generar[j].TipoMensaje === "S")) {
							matT = generar[j].Material;
							if (generar[j].Precio !== "") {
								posT = j;
							}
							suma = suma + parseInt(generar[j].CantPed, 10);

						}
						if (matT === generar[j].Material && generar[j].TipoMensaje === "") {
							suma = suma + parseInt(generar[j].CantPed, 10);
						}
					}
					matT = "";
					if (posT > -1) {
						if (parseInt(generar[posT].CantAsig, 10) < suma && parseInt(generar[posT].CantAsig, 10) !== 0) {
							color = 'sap-icon://status-critical';
							ncolor = '#ffbc05';
							//' https://img2.freepng.es/20180627/bx/kisspng-yellow-circle-paper-painting-dandelion-yellow-5b339ba270d457.9979163215301088344622.jpg' ;
							//'http://es.fordesigner.com/imguploads/Image/cjbc/zcool/png20080526/1211767932.png';
						}
						if (parseInt(generar[posT].CantAsig, 10) === 0) {
							color = 'sap-icon://status-negative';
							//'https://static-s.aa-cdn.net/img/gp/20600006125457/pFoesNrvZaMJkbJrm-LRT5lZGRtD51U275MROzUBOMI1PK7nLwrvsug9dq6Bod6atqg=w300?v=1';
							ncolor = '#e30000'
						}
						if (parseInt(generar[posT].CantAsig, 10) === suma) {
							color = 'sap-icon://status-positive';
							ncolor = '#00c753';
							//'https://pngimage.net/wp-content/uploads/2018/05/esfera-verde-png.png';
						}
						for (var k = 0; k < org.length; k++) {
							if (org[k].Material === generar[posT].Material) {
								var cantorg = org[k].CantPed;
								var cant2 = org[k].cant;
							}

						}
						var json5 = {
							"CantPed": suma, ///165463AW0J//0000136939
							"CantOrg": cantorg,
							"Recargo": Number(generar[posT].Recargo),
							"TipoMensaje": generar[posT].TipoMensaje,
							"PrecioVenta": Number(generar[posT].PrecioVenta),
							"Mensaje": generar[posT].Mensaje,
							"PrecioFinal": Number(generar[posT].PrecioFinal),
							"CantAsig": parseInt(generar[posT].CantAsig, 10), //generar[posT].CantAsig,
							"Descuento": Number(generar[posT].Descuento),
							"codigopat": generar[posT].Material,
							"Cliente": generar[posT].Cliente,
							"Precio": Number(generar[posT].Precio),
							"descrip": unicosExT[i].DESCRIPCION,
							"CantMini": unicosExT[i].CANTMIN,
							"MVenta": unicosExT[i].MVENTA,
							"unidad": "PC",
							"backOrder": true,
							"color": color,
							"ncolor": ncolor,
							"cant": cant2
						};
						arr3.push(json5);
					}

				
					suma = 0;
					posT = -1;

				}
				if (flagperfil === false) {
					oView.byId("cantstock").setVisible(false);
					oView.byId("cantsotck2").setVisible(false);

				}
			
				var dataT = new sap.ui.model.json.JSONModel(arr3);
				oView.setModel(dataT, "listadoMateriales");

			}
			t.popupmensaje(unicosNeExTemp);
		},

		check: function (oEvent) {
			var arryT = [];
			var dataT;
			oSelectedItem = oEvent.getSource().getParent();
			var n2 = oSelectedItem.getBindingContext("listadoMateriales").getProperty("codigopat");
			for (var i = 0; i < oView.getModel("listadoMateriales").oData.length; i++) {
				if (oView.getModel("listadoMateriales").oData[i].codigopat === oSelectedItem.getBindingContext("listadoMateriales").getProperty(
						"codigopat")) {
					arryT.push({
						CantPed: oView.getModel("listadoMateriales").oData[i].CantPed,
						CantOrg: oView.getModel("listadoMateriales").oData[i].CantOrg,
						Recargo: oView.getModel("listadoMateriales").oData[i].Recargo,
						TipoMensaje: oView.getModel("listadoMateriales").oData[i].TipoMensaje,
						PrecioVenta: oView.getModel("listadoMateriales").oData[i].PrecioVenta,
						Mensaje: oView.getModel("listadoMateriales").oData[i].Mensaje,
						PrecioFinal: oView.getModel("listadoMateriales").oData[i].PrecioFinal,
						CantAsig: oView.getModel("listadoMateriales").oData[i].CantAsig,
						Descuento: oView.getModel("listadoMateriales").oData[i].Descuento,
						codigopat: oView.getModel("listadoMateriales").oData[i].codigopat,
						Cliente: oView.getModel("listadoMateriales").oData[i].Cliente,
						Precio: oView.getModel("listadoMateriales").oData[i].Precio,
						descrip: oView.getModel("listadoMateriales").oData[i].descrip,
						CantMini: oView.getModel("listadoMateriales").oData[i].CantMini,
						MVenta: oView.getModel("listadoMateriales").oData[i].MVenta,
						unidad: oView.getModel("listadoMateriales").oData[i].unidad,
						backOrder: oEvent.getParameters("value").selected,
						color: oView.getModel("listadoMateriales").oData[i].color,
						ncolor: oView.getModel("listadoMateriales").oData[i].ncolor

					});

				} else {
					arryT.push({
						CantPed: oView.getModel("listadoMateriales").oData[i].CantPed,
						Recargo: oView.getModel("listadoMateriales").oData[i].Recargo,
						CantOrg: oView.getModel("listadoMateriales").oData[i].CantOrg,
						TipoMensaje: oView.getModel("listadoMateriales").oData[i].TipoMensaje,
						PrecioVenta: oView.getModel("listadoMateriales").oData[i].PrecioVenta,
						Mensaje: oView.getModel("listadoMateriales").oData[i].Mensaje,
						PrecioFinal: oView.getModel("listadoMateriales").oData[i].PrecioFinal,
						CantAsig: oView.getModel("listadoMateriales").oData[i].CantAsig,
						Descuento: oView.getModel("listadoMateriales").oData[i].Descuento,
						codigopat: oView.getModel("listadoMateriales").oData[i].codigopat,
						Cliente: oView.getModel("listadoMateriales").oData[i].Cliente,
						Precio: oView.getModel("listadoMateriales").oData[i].Precio,
						descrip: oView.getModel("listadoMateriales").oData[i].descrip,
						CantMini: oView.getModel("listadoMateriales").oData[i].CantMini,
						MVenta: oView.getModel("listadoMateriales").oData[i].MVenta,
						unidad: oView.getModel("listadoMateriales").oData[i].unidad,
						backOrder: oView.getModel("listadoMateriales").oData[i].backOrder,
						color: oView.getModel("listadoMateriales").oData[i].color,
						ncolor: oView.getModel("listadoMateriales").oData[i].ncolor

					});
				}
			}
		
			dataT = new sap.ui.model.json.JSONModel(arryT);
			oView.setModel(dataT, "listadoMateriales");
			oSelectedItem = undefined;

		},
		handleDelete: function (oEvent) {
			var arryT = [];
			oSelectedItem = oEvent.getSource().getParent();
			var deleteT = oSelectedItem.sId.toString().substring(oSelectedItem.sId.length - 1, oSelectedItem.sId.length);

			for (var i = 0; i < oView.getModel("listadoMateriales").oData.length; i++) {
				if (i.toString() !== deleteT) {
					arryT.push({
						CantPed: oView.getModel("listadoMateriales").oData[i].CantPed,
						CantOrg: oView.getModel("listadoMateriales").oData[i].CantOrg,
						Recargo: oView.getModel("listadoMateriales").oData[i].Recargo,
						TipoMensaje: oView.getModel("listadoMateriales").oData[i].TipoMensaje,
						PrecioVenta: oView.getModel("listadoMateriales").oData[i].PrecioVenta,
						Mensaje: oView.getModel("listadoMateriales").oData[i].Mensaje,
						PrecioFinal: oView.getModel("listadoMateriales").oData[i].PrecioFinal,
						CantAsig: oView.getModel("listadoMateriales").oData[i].CantAsig,
						Descuento: oView.getModel("listadoMateriales").oData[i].Descuento,
						codigopat: oView.getModel("listadoMateriales").oData[i].codigopat,
						Cliente: oView.getModel("listadoMateriales").oData[i].Cliente,
						Precio: oView.getModel("listadoMateriales").oData[i].Precio,
						descrip: oView.getModel("listadoMateriales").oData[i].descrip,
						CantMini: oView.getModel("listadoMateriales").oData[i].CantMini,
						MVenta: oView.getModel("listadoMateriales").oData[i].MVenta,
						unidad: oView.getModel("listadoMateriales").oData[i].unidad,
						backOrder: oView.getModel("listadoMateriales").oData[i].backOrder,
						color: oView.getModel("listadoMateriales").oData[i].color,
						ncolor: oView.getModel("listadoMateriales").oData[i].ncolor
					});
				}
			}
			var dataT = new sap.ui.model.json.JSONModel(arryT);
			oView.setModel(dataT, "listadoMateriales");
			oSelectedItem = undefined;
		},
		CreaPedido: function (id) {
			t.popCarga();
			var men = "";
			var arr = [];
			var result = [];
			var status;
			var cantpedida;
			//	t.popCarga();
			var result = [];
			var json2 = oView.getModel("listadoMateriales").oData;
		

			if (destino === "" || destino === null || destino === undefined) {
				var obj = {
					codigo: "400",
					descripcion: "El Destinatario se encuentra vacío favor cargar nuevamente "
				};
				arr.push(obj);

				t.popError(arr, "Error de Comunicacion");
			} else {
			
				for (var i = 0; i < json2.length; i++) {
					if (json2[i].backOrder === false) {
						cantpedida = json2[i].CantAsig;
					} else {
						cantpedida = json2[i].CantPed;
					}

					var json3 = {
						"Cliente": cliente,
						"Dest": destino,
						"PedWeb": pedido,
						"Tipo": "YNCS",
						"Material": json2[i].codigopat,
						"CantPed": cantpedida.toString(),
						"Vin": "",
						"OrdRep": "",
						"TipoMensaje": "",
						"Mensaje": "",
						"Usuario": oUsuariosap
					};
					result.push(json3);
				}

				var json = {
					"Cliente": "",
					"Nav_Header_Pedido": result

				};
				var arrjson = JSON.stringify(json);
                var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
                var appModulePath = jQuery.sap.getModulePath(appid);
				//	var url = '/destinations/AR_DP_DEST_CPI/http/AR/DealerPortal/Pedido/Creacion';
				var url = '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CREAR_PEDIDO_SRV/HeaderSet';
				$.ajax({
					type: 'POST',
					url:appModulePath + url,
					headers: {
						"X-CSRF-Token": id
					},
					contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					async: true,
					data: arrjson,
					success: function (dataR, textStatus, jqXHR) {
						t.cerrarPopCarga2();

						if (dataR.d !== "" || dataR.d !== undefined || dataR.d !== null) {
							
							if (dataR.d.Nav_Header_Pedido.results.Mensaje !== undefined) {
								var mensaje = dataR.d.Nav_Header_Pedido.results.Mensaje;
							} else {
								var mensaje = dataR.d.Nav_Header_Pedido.results[0].Mensaje;
							}

							try {
								if (dataR.d.Nav_Header_Pedido.results[0].TipoMensaje === "S") {
									var obj = {
										codigo: "200",
										descripcion: mensaje
									};
									arr.push(obj);

									t.popSucces(arr, "Pedido Creado Exitosamente");
									
									let nroPedido = t.extraerNroPedido(mensaje);
									t.generarEntradaAuditoria(nroPedido);
								} else {
								
									var obj = {
										codigo: "400",
										descripcion: mensaje
									};
									arr.push(obj);
									t.popSucces(arr, "Error de Comunicacion");
									//	t.popError(arr, "Error de Comunicacion");
								}
							} catch (e) {
								if (dataR.d.Nav_Header_Pedido.results.TipoMensaje === "S") {
									var obj = {
										codigo: "200",
										descripcion: mensaje
									};
									arr.push(obj);

									t.popSucces(arr, "Pedido Creado Exitosamente");
									
									//TODO auditoria, todavia no poner en PRD
									let nroPedido = t.extraerNroPedido(mensaje);
									t.generarEntradaAuditoria(nroPedido);
								} else {
								
									var obj = {
										codigo: "400",
										descripcion: mensaje
									};
									arr.push(obj);
									t.popSucces(arr, "Error de Comunicacion");
									//	t.popError(arr, "Error de Comunicacion");
								}
							}
						} else {
							var obj = {
								codigo: "400",
								descripcion: "Existen Problemas en la comunicación con los servicios favor contactar a soporte"
							};
							arr.push(obj);

							t.popError(arr, "Error de Comunicacion");
						}

					},
					error: function (jqXHR, textStatus, errorThrown) {
						t.cerrarPopCarga2();
						var obj = {
							codigo: "500",
							descripcion: "Existen Problemas en la comunicación con los servicios favor contactar a soporte"
						};
						arr.push(obj);
						t.popError(arr, "Error de Comunicacion");
					}
				});
			}
		},
		generarEntradaAuditoria: function(nroPedido){
			let that = this;
			let dfdGenerarEntrada = $.Deferred();
			
			let dfdIsNissanUser = Utils.isCurrentUserANissanUser();
			let dfdUserIASData = Utils.loadCurrentUserIASData();
			
			$.when(dfdIsNissanUser, dfdUserIASData).then(function(isNissanUser, currentUserIAS){
				let identificador = {
					"Número pedido": nroPedido
				}
				
				let data = {
					ID_OBJETO: JSON.stringify(identificador),
					ID_ACCION: 1,
					TIPO_USUARIO: isNissanUser ? "N" : "D",
					USUARIO: currentUserIAS.id,
					NOMBRE_USUARIO: currentUserIAS.name.givenName + " " + currentUserIAS.name.familyName,
					FECHA: new Date()
				}
				// var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
 				// var appModulePath = jQuery.sap.getModulePath(appid);
				// let oModel = new sap.ui.model.odata.ODataModel(appModulePath + '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata', false);
				// oModel.create("/EntradaAuditoria", data, {
				that._oDataHanaModel.create("/EntradaAuditoria", data, {
					success: function (odata, oResponse) {
						dfdGenerarEntrada.resolve();
					}
				});
			});
			
			return dfdGenerarEntrada;
		},
		extraerNroPedido: function(mensaje){
			return mensaje.split(":")[1].trim();
		},
		CreaPedidocpi: function () {
			t.popCarga();
			var men = "";
			var arr = [];
			var status;
			var cantpedida;
			//	t.popCarga();
			var result = [];
			var json2 = oView.getModel("listadoMateriales").oData;
		

			if (destino === "" || destino === null || destino === undefined) {
				var obj = {
					codigo: "400",
					descripcion: "El Destinatario se encuentra vacío favor cargar nuevamente "
				};
				arr.push(obj);

				t.popError(arr, "Error de Comunicacion");
			} else {

				for (var i = 0; i < json2.length; i++) {
					if (json2[i].backOrder === false) {
						cantpedida = json2[i].CantAsig;
					} else {
						cantpedida = json2[i].CantPed;
					}

					var arrn = {
						"Cliente": cliente,
						"Dest": destino,
						"PedWeb": pedido,
						"Tipo": "YNCS",
						"Material": json2[i].codigopat,
						"CantPed": cantpedida,
						"Vin": "",
						"OrdRep": "",
						"TipoMensaje": "",
						"Mensaje": "",
						"Usuario": oUsuariosap
					};
					result.push(arrn);

				}
			
				var json = {
					"HeaderSet": {
						"Header": {
							"Nav_Header_Pedido": {
								"Pedido": result
							}
						}
					}
				};

				var arrjson = JSON.stringify(json);
                var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
                var appModulePath = jQuery.sap.getModulePath(appid);
				var url =appModulePath + '/destinations/AR_DP_DEST_CPI/http/AR/DealerPortal/Pedido/Creacion';
				// var url = '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CREAR_PEDIDO_SRV/HeaderSet';
				$.ajax({
					type: 'POST',
					url: url,

					contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					async: true,
					data: arrjson,
					success: function (dataR, textStatus, jqXHR) {
						t.cerrarPopCarga2();

						if (dataR.HeaderSet !== "" || dataR.HeaderSet !== undefined || dataR.HeaderSet !== null) {
						
							if (dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido.Mensaje !== undefined) {
								var mensaje = dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido.Mensaje;
							} else {
								var mensaje = dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido[0].Mensaje;
							}

							try {
								if (dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido[0].TipoMensaje === "S") {
									var obj = {
										codigo: "200",
										descripcion: mensaje
									};
									arr.push(obj);

									t.popSucces(arr, "Pedido Creado Exitosamente");
									
									//TODO auditoria, todavia no poner en PRD
									let nroPedido = t.extraerNroPedido(mensaje);
									t.generarEntradaAuditoria(nroPedido);
								} else {
								
									var obj = {
										codigo: "400",
										descripcion: mensaje
									};
									arr.push(obj);
									t.popSucces(arr, "Error de Comunicacion");
									//	t.popError(arr, "Error de Comunicacion");
								}
							} catch (e) {
								if (dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido.TipoMensaje === "S") {
									var obj = {
										codigo: "200",
										descripcion: mensaje
									};
									arr.push(obj);

									t.popSucces(arr, "Pedido Creado Exitosamente");
									
									//TODO auditoria, todavia no poner en PRD
									let nroPedido = t.extraerNroPedido(mensaje);
									t.generarEntradaAuditoria(nroPedido);
								} else {
								
									var obj = {
										codigo: "400",
										descripcion: mensaje
									};
									arr.push(obj);
									t.popSucces(arr, "Error de Comunicacion");
									//	t.popError(arr, "Error de Comunicacion");
								}
							}
						} else {
							var obj = {
								codigo: "400",
								descripcion: "Existen Problemas en la comunicación con los servicios favor contactar a soporte"
							};
							arr.push(obj);

							t.popError(arr, "Error de Comunicacion");
						}

					},
					error: function (jqXHR, textStatus, errorThrown) {
						t.cerrarPopCarga2();
						var obj = {
							codigo: "500",
							descripcion: "Existen Problemas en la comunicación con los servicios favor contactar a soporte"
						};
						arr.push(obj);

						t.popError(arr, "Error de Comunicacion");
					}
				});
			}
		},

		//************************
		ConsultaOdata: function () {
			var codigo = false;
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			var url = appModulePath + '/destinations/IDP_Nissan/service/scim/Users/' + oUsuariosap;

			//Consulta
			$.ajax({
				type: 'GET',
				url: url,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: false,
				success: function (dataR, textStatus, jqXHR) {
					var grupos = dataR.groups;
				
					for (var i = 0; i < grupos.length; i++) {

						if (dataR.groups[i].value === "AR_DP_ADMINISTRADORDEALER" || dataR.groups[i].value === "AR_DP_USUARIODEALER") {
							codigo = true;
						}
					}

				},
				error: function (jqXHR, textStatus, errorThrown) {

				}
			});

			if (codigo === false) {
				console.log("vamos por principal");
				t.CreaPedido(t.getToken());
			} else {
				console.log("vamos por cpi");
				t.CreaPedidocpi();
			}

		},
		getToken: function () {
			//Consulta
			var id = null;
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			$.ajax({
				type: 'GET',
				url: appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CREAR_PEDIDO_SRV/HeaderSet',

				headers: {
					"X-CSRF-Token": "Fetch"
				},
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: false,
				success: function (dataR, textStatus, jqXHR) {
					id = jqXHR.getResponseHeader('X-CSRF-Token');
				},
				error: function (jqXHR, textStatus, errorThrown) {
					id = jqXHR.getResponseHeader('X-CSRF-Token');
				}
			});
			return id;
		},

		//***********************
		//demanda perdida

		DemandaPerdidaCab: function () {
            // var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            // var appModulePath = jQuery.sap.getModulePath(appid);
			// var oModel = new sap.ui.model.odata.ODataModel(appModulePath + '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata', false);

			var json = {
				"ID_PEDIDO": 0,
				"ID_USUARIO_SCP": oUsuariosap,
				"FECHA": new Date(),
				"ID_SOLICITANTE": cliente,
				"ID_DESTINARIO": destino,
				"ID_TIPOPEDIDO": "YNCS"
			};
		
			this._oDataHanaModel.create("/PedidoDemanda", json, null, function (odata, oResponse) {
				t.DemandaPerdidaBody(odata.ID_PEDIDO);
			});
		},
		DemandaPerdidaBody: function (variable) {
			let that = this;

			if (oView.getModel("listadoMateriales") === undefined || oView.getModel("listadoMateriales").oData.length === 0) {

				t.homee();
			} else {
				var json2 = oView.getModel("listadoMateriales").oData;
				var msext = []
                // var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  				// var appModulePath = jQuery.sap.getModulePath(appid);
				// var oModel = new sap.ui.model.odata.ODataModel(appModulePath + '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata', false);
				for (var i = 0; i < json2.length; i++) {
					var json = {
						"ID_PEDIDO": parseInt(variable, 10),
						"MATERIAL": json2[i].codigopat,
						"CANTPED": parseFloat(json2[i].CantPed.toString().replace(/\./g, ","), 2),
						"TIPO_MENSAJE": json2[i].TipoMensaje,
						"RECARGO": parseFloat(json2[i].Recargo.toString().replace(/\./g, ","), 2),
						"PRECIOVENTA": parseFloat(json2[i].PrecioVenta.toString().replace(/\./g, ","), 2),
						"CANTASIG": parseFloat(json2[i].CantAsig.toString().replace(/\./g, ","), 3),
						"DESCUENTO": parseFloat(json2[i].Descuento.toString().replace(/\./g, ","), 2),
						"PRECIO": parseFloat(json2[i].Precio, 2)
					};
					msext.push(that._oDataHanaModel.createBatchOperation("/PedidoDemandaDetalle", "POST", json));
				}
			
				that._oDataHanaModel.addBatchChangeOperations(msext);
				that._oDataHanaModel.submitBatch(function (data) {
					that._oDataHanaModel.refresh();

				}, function (err) {

				});
			}
		},

		//popups

		popSucces: function (obj, titulo) {
			var oDialog = oView.byId("dialogSucces");
			var log = new sap.ui.model.json.JSONModel(obj);
			oView.setModel(log, "Succes");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Succes", this); //aqui se debe cambiar ar_dp_rep
				oView.addDependent(oDialog);
			}
			oView.byId("dialogSucces").addStyleClass(this.getOwnerComponent().getContentDensityClass());
			oDialog.open();
			oView.byId("dialogSucces").setTitle("Success: " + titulo);
			//	oView.byId("dialogSucces").setState("Succes");
		},
		cerrarPopSucces: function () {
			oView.byId("dialogSucces").close();
			t.homee();
		},
		popSuccesCorreo: function (obj, titulo) {
			var oDialog = oView.byId("SuccesCorreo");
			var log = new sap.ui.model.json.JSONModel(obj);
			oView.setModel(log, "Succes");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.SuccesCorreo", this); //aqui se debe cambiar ar_dp_rep
				oView.addDependent(oDialog);
			}
			oView.byId("SuccesCorreo").addStyleClass(this.getOwnerComponent().getContentDensityClass());
			oDialog.open();
			oView.byId("SuccesCorreo").setTitle("Success: " + titulo);
			//	oView.byId("dialogSucces").setState("Succes");
		},
		cerrarPopSuccesCorreo: function () {
			oView.byId("SuccesCorreo").close();
			t.limpiezacorreo();
			t.cerrarEnvioCorreo();
		},
		popError: function (obj, titulo) {
			var log = new sap.ui.model.json.JSONModel(obj);
			oView.setModel(log, "error");
			var oDialog = oView.byId("dialogError");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Error", this);
				oView.addDependent(oDialog);
			}
			oView.byId("dialogError").addStyleClass(this.getOwnerComponent().getContentDensityClass());
			oDialog.open();
			oView.byId("dialogError").setTitle("Error: " + titulo);
			//	oView.byId("dialogError").setState("Error");
		},
		cerrarPopError: function () {
			oView.byId("dialogError").close();
			t.homee();
		},
		popError3: function (obj, titulo) {
			var log = new sap.ui.model.json.JSONModel(obj);
			oView.setModel(log, "error");
			var oDialog = oView.byId("dialogError333");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Error3", this);
				oView.addDependent(oDialog);
			}
			oView.byId("dialogError333").addStyleClass(this.getOwnerComponent().getContentDensityClass());
			oDialog.open();
			oView.byId("dialogError333").setTitle("Error: " + titulo);
			// oView.byId("dialogError").setState("Error");
		},
		cerrarPopError3: function () {
			oView.byId("dialogError333").close();

		},
		PopUPcorrecto: function (obj, titulo) {
			var log = new sap.ui.model.json.JSONModel(obj);
			log = log.oData;
			oView.setModel(log, "Succes");
			var oDialog = oView.byId("dialogCorrecto");
			//		console.log(log);
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.correcto", this);
				oView.addDependent(oDialog);
			}
			oView.byId("dialogCorrecto").addStyleClass(this.getOwnerComponent().getContentDensityClass());
			oDialog.open();
			oView.byId("dialogCorrecto").setTitle(titulo);
			// oView.byId("dialogCorrecto").setState("Succes");
		},
		cerrarPopUPcorrecto: function () {
			oView.byId("dialogCorrecto").close();
		},
		popCarga: function () {
			var oDialog = oView.byId("indicadorCarga");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.PopUp", this);
				oView.addDependent(oDialog);
			}
			oDialog.open();
			//	oView.byId("textCarga").setText(titulo);
		},
		cerrarPopCarga2: function () {
			oView.byId("indicadorCarga").close();
		},

		//otras cosas
		homee: function () {
			var mensaje = "exito";

			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("menuprincipal");

			t.limpieza();

		},
		homeedemandaperdida: function () {
			t.DemandaPerdidaCab();
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("menuprincipal");
			t.limpieza();

		},
		atras: function () {
			//INICIO
			var arreglo = [];
			msext = [];
			generar = [];
			//console.log(datos[0].Cliente);
			for (var i = 0; i < datos.length; i++) {
				if (datos[i].Cliente === undefined) {
					var arrnT = {
						"material": datos[i].material,
						"cantidad": datos[i].cantidad
					};
					arreglo.push(arrnT);
				}

			}
			console.log(arreglo);
			sap.ui.controller("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.CrearPedidoStock").jsoncreacion(cliente, pedido, destino,
				arreglo, oUsuariosap);
			//FIN
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("stock");
			cliente = "";
			pedido = "";
			destino = "";
			datos = [];
		},
		//pop informacion

		buttonTypeFormatter: function () {
			var sHighestSeverity;
			var aMessages = this.getView().getModel().oData;

			aMessages.forEach(function (sMessage) {
				switch (sMessage.type) {
				case "Error":
					sHighestSeverity = "Negative";
					break;
				case "Warning":
					sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
					break;
				case "Success":
					sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
					break;
				default:
					sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
					break;
				}
			});

			return sHighestSeverity;
		},

		limpieza: function () {

			generar = [];
			generar2 = "";
			oSelectedItem = undefined;
			cliente = "";
			pedido = "";
			destino = "";
			datos = "";
			msext = [];
			superarr = [];
			oMessagePopover = "";
			var arrt = [];
			var dataT = new sap.ui.model.json.JSONModel(arrt);
			oView.setModel(dataT, "listadoMateriales");
		},

		// Set the button icon according to the message with the highest severity
		buttonIconFormatter: function () {
			var sIcon;
			var aMessages = this.getView().getModel().oData;

			aMessages.forEach(function (sMessage) {
				switch (sMessage.type) {
				case "Error":
					sIcon = "sap-icon://message-error";
					break;
				case "Warning":
					sIcon = sIcon !== "sap-icon://message-error" ? "sap-icon://message-warning" : sIcon;
					break;
				case "Success":
					sIcon = "sap-icon://message-error" && sIcon !== "sap-icon://message-warning" ? "sap-icon://message-success" : sIcon;
					break;
				default:
					sIcon = !sIcon ? "sap-icon://message-information" : sIcon;
					break;
				}
			});

			return sIcon;
		},

		handleMessagePopoverPress: function (oEvent) {
			oMessagePopover.toggle(oEvent.getSource());
		},
		limpiezacorreo: function () {
			oView.byId("materialess").setValue("");
			oView.byId("descrpcion").setValue("");
		}

	});

});