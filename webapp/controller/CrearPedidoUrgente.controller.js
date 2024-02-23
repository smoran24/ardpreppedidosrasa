sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"jquery.sap.global",
	'sap/ui/core/Fragment',
	'sap/ui/model/Filter',
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/MessageBox",
	"../utils/ValueHelp"
], function (Controller, MessageToast, global, Fragment, Filter, Button, Dialog, Text, MessageBox,ValueHelp) {
	"use strict";
	var oView, oSAPuser, t, Button, Dialog, oSelectedItem, data, arrjson, Respuesta, a, b, c, codsucursal, selectaut, cantorg = [],
		flagperfil = true;
	var mnext = [],
		msext = [];
	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.CrearPedidoUrgente", {
		onInit: function () {
			jQuery.sap.require("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.js.jszip");
			jQuery.sap.require("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.js.xlsx");

			this._localModel = this.getOwnerComponent().getModel();
			this._oDataHanaModel = this.getOwnerComponent().getModel("ODataHana");

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("urgente").attachMatched(this._onRouteMatched, this);
			//	this.limpieza();
			t = this;
			oView = this.getView();
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			$.ajax({
				type: 'GET',
                dataType:"json",
				url:appModulePath +  "/services/userapi/currentUser",
				success: function (dataR, textStatus, jqXHR) {
					oSAPuser = dataR.name;

					t.leerUsuario(oSAPuser);
				},
				error: function (jqXHR, textStatus, errorThrown) {}
			});
			// t.leerUsuario(oSAPuser);
			//t.ConsultaOdata2();
			t.ConsultaOdata3();

			t.ConsultaMaterial();

		},
		//funciones de logica

		leerUsuario: function (oSAPuser) {
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            var appModulePath = jQuery.sap.getModulePath(appid);
			var url = appModulePath + '/destinations/IDP_Nissan/service/scim/Users/' + oSAPuser;
			//Consulta
			$.ajax({
				type: 'GET',
				url: url,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: false,
				success: function (dataR, textStatus, jqXHR) {
					if (dataR["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"] === undefined) {
						var custom = "";
					} else {
						var custom = dataR["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes;
					}
					for (var i = 0; i < dataR.groups.length; i++) {

						if (dataR.groups[i].value === "AR_DP_ADMINISTRADORDEALER" || dataR.groups[i].value === "AR_DP_USUARIODEALER") {
							flagperfil = false;
							for (var x = 0; x < custom.length; x++) {
								if (custom[x].name === "customAttribute6") {
									codsucursal = "0000" + custom[x].value;
								}
							}
						}
					}
					//console.log(flagperfil);
					if (!flagperfil) {
						// codsucursal =codsucursal;
						oView.byId("cmbcliente").setSelectedKey(codsucursal);
						oView.byId("cmbcliente").setEditable(false);
						selectaut = true;
						t.ConsultaOdata3();
						t.ConsultaOdata4();
						t.Destinatario();
						//console.log("0000" + codsucursal);
					} else {
						oView.byId("cmbcliente").setEditable(true);
					}

				},
				error: function (jqXHR, textStatus, errorThrown) {

				}
			});

		},
		onSubirArchivo: function (oEvent) {
			var oThis = this,
				file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
			//sap.ui.core.BusyIndicator.show(0);
			if (file && window.FileReader) {
				var reader = new FileReader(),
					result = {},
					data;
				reader.onload = function (e) {
					data = e.target.result;
					var wb = XLS.read(data, {
						type: "binary",
						cellDates: true,
						cellStyles: true
					});
					wb.Sheets[wb.SheetNames[0]].A1.h = "material";
					wb.Sheets[wb.SheetNames[0]].A1.r = "<t>material</t>";
					wb.Sheets[wb.SheetNames[0]].A1.v = "material";
					wb.Sheets[wb.SheetNames[0]].A1.w = "material";

					//console.log(wb.Sheets[wb.SheetNames[0]].B1);
					wb.Sheets[wb.SheetNames[0]].B1.h = "cantidad";
					wb.Sheets[wb.SheetNames[0]].B1.r = "<t>cantidad</t>";
					wb.Sheets[wb.SheetNames[0]].B1.v = "cantidad";
					wb.Sheets[wb.SheetNames[0]].B1.w = "cantidad";
					wb.SheetNames.forEach(function (sheetName) {
						var roa = XLS.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
						if (roa.length > 0) {
							result[sheetName] = roa;
							// var oSelModel = this.getOwnerComponent().getModel("selectedValues"),
							// 	data = {
							// 		nombre: wb.SheetNames[0]
							// 	};
							//console.log(roa);
							t.suma(roa);
							//console.log("oooo");
						}
					}.bind(this));
				}.bind(this);
				reader.readAsBinaryString(file);
			}

		},
		suma: function (roa) {

			var result = [],
				flagT = true, //****
				cantidadT = 0,
				resultT = []; //***
			var json2 = roa; //**linea 73

			//	este for
			for (var i = 0; i < json2.length; i++) {
				for (var j = 0; j < resultT.length; j++) {
					if (json2[i].material.toString().toUpperCase() === resultT[j].material) {
						flagT = false;
						j = resultT.length + 1;
					}
				}
				if (flagT) {
					var arrn = {
						"material": json2[i].material.toString().toUpperCase(),
						"cantidad": json2[i].cantidad,
						// "__rowNum__": json2[i].__rowNum__
					};
					resultT.push(arrn);
				}
				flagT = true;
			}

			//cantorg =[];
			for (var i = 0; i < resultT.length; i++) {
				cantidadT = 0;
				for (var j = 0; j < json2.length; j++) {
					if (json2[j].material.toString().toUpperCase() === resultT[i].material) {
						cantidadT = cantidadT + parseInt(json2[j].cantidad, 10);
					}

				}

				var arrnT = {
					"material": resultT[i].material.toString().toUpperCase(),
					"cantidad": cantidadT,
					// "__rowNum__": resultT[i].__rowNum__

				};

				cantorg.push(arrnT);

			}
			var data = new sap.ui.model.json.JSONModel(cantorg);
			t.getView().setModel(data, "listadoMateriales");
		},

		cargaTabla: function (obj) {
			var r = obj.sort(function (a, b) {
				var x = a.LOGIN;
				var y = b.LOGIN;
				if (x < y) {
					return -1;
				}
				if (x > y) {
					return 1;
				}
				return 0;
			});
			data = new sap.ui.model.json.JSONModel(r);
			t.getView().setModel(data, "listadoMateriales");
		},

		Editar: function (oEvent) {
			oSelectedItem = oEvent.getSource().getParent();
			var mate = oSelectedItem.getBindingContext("listadoMateriales").getProperty("material");
			var cant = oSelectedItem.getBindingContext("listadoMateriales").getProperty("cantidad");
			oView.byId("material").setValue(mate);
			oView.byId("Cantidad").setValue(cant);

		},
		Editar2: function (oEvent) {
			oView.getModel("listadoMateriales").setProperty("cantidad", oView.byId("Cantidad").getValue(), oSelectedItem.getBindingContext(
				"listadoMateriales"));
			oView.getModel("listadoMateriales").setProperty("material", oView.byId("material").getValue(), oSelectedItem.getBindingContext(
				"listadoMateriales"));
			oSelectedItem = undefined;
		},

		onSave: function () {
			var cant = oView.byId("Cantidad").getValue();
			var mat = oView.byId("material").getValue();

			var arryT = [];
			if (oView.getModel("listadoMateriales") === undefined) {
				cantorg.push({
					material: mat,
					cantidad: cant,
				});
				var dataT = new sap.ui.model.json.JSONModel([{
					material: mat,
					cantidad: cant,
				}]);
				oView.setModel(dataT, "listadoMateriales");
				//	t.GenerarJson();

			} else {

				var oBinding = oView.getModel("listadoMateriales"); //oList.getBinding("listadoMateriales"),
				arryT = oBinding.oData;
				arryT.push({
					material: mat,
					cantidad: cant,
				});
				var dataT = new sap.ui.model.json.JSONModel(arryT);
				oView.setModel(dataT, "listadoMateriales");
				//	t.GenerarJson();
			}
			return (arryT);

		},
		camino: function () {
			if (oView.byId("material").getValue() !== "" && oView.byId("Cantidad").getValue() !== "") {
				if (oSelectedItem === undefined) {
					t.onSave();
				} else {
					t.Editar2();
				}

				oView.byId("Cantidad").setValue();
				oView.byId("material").setValue();
			}

		},
		handleDelete: function (oEvent) {
			var arryT = [];
			oSelectedItem = oEvent.getSource().getParent();
			var deleteT = oSelectedItem.oBindingContexts.listadoMateriales.sPath.replace(/\//g, "");
			//oSelectedItem.sId.toString().substring(oSelectedItem.sId.length - 1, oSelectedItem.sId.length);

			for (var i = 0; i < oView.getModel("listadoMateriales").oData.length; i++) {
				if (i.toString() !== deleteT) {
					arryT.push({
						cantidad: oView.getModel("listadoMateriales").oData[i].cantidad,
						material: oView.getModel("listadoMateriales").oData[i].material
					});
				}
			}
			var dataT = new sap.ui.model.json.JSONModel(arryT);
			oView.setModel(dataT, "listadoMateriales");
			oSelectedItem = undefined;
		},
		validacantidadm: function () {
			var arr = [];
			if (oView.byId("Cantidad").getValue() < 1 && oView.byId("Cantidad").getValue() !== "") {
				var obj = {
					codigo: "01",
					descripcion: "Numero debe ser mayor a 0 "
				};
				arr.push(obj);
				t.popError(arr, "Ingreso Cantidad");
				oView.byId("Cantidad").setValue();
			}

		},
		validacampos: function () {
			//console.log(oView.getModel("listadoMateriales"));
			var arr = [];
			if (oView.byId("cmbcliente").getValue() === "" || oView.byId("Pdealer").getValue() === "" || oView.byId("interlocutor").getValue() ===
				"") {
				var obj = {
					codigo: "01",
					descripcion: "Los campos DEALER  ,N° PEDIDO o DIRECCIÓN No pueden ser vacios "
				};
				arr.push(obj);

				t.popError(arr, "Ingreso Cantidad");
				oView.byId("Cantidad").setValue();

			} else if (oView.getModel("listadoMateriales") === undefined || oView.getModel("listadoMateriales").oData.length === 0) {
				var obj = {
					codigo: "02",
					descripcion: "Debe cargar al menos un material"
				};
				arr.push(obj);

				t.popError(arr, "Ingreso Valores Válidos ");
			} else {
				t.ConsultaStock();
			}

		},
		popError: function (obj, titulo) {

			// obj.push({
			// 	codigo: "01",
			// 	descripcion: "Cantidad debe ser mayor a 0"
			// })

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
			oView.byId("dialogError").setState("Error");
		},
		cerrarPopError: function () {
			oView.byId("dialogError").close();
			// if (oDialogSeguros === true) {
			// 	t.popSeguro1();
			// }
		},
		jsoncreacion: function (a, b, c, d, e) {
			oView.byId("cmbcliente").setSelectedKey(a);
			oView.byId("Pdealer").setValue(b);
			oView.byId("interlocutor").setSelectedKey(c);
			var dataT = new sap.ui.model.json.JSONModel(d);
			oView.setModel(dataT, "listadoMateriales");
			oSAPuser = e;
			// //console.log(cliente + "," + pedido + "," + destino, datos);
		},
		ConsultaOdata2: function () {
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            var appModulePath = jQuery.sap.getModulePath(appid);
			var region =appModulePath + '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata';
			//console.log(region);
			//Consulta
			$.ajax({
				type: 'GET',
				url: region,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: true,
				success: function (dataR, textStatus, jqXHR) {

					//console.log(dataR);
				},
				error: function (jqXHR, textStatus, errorThrown) {
					//console.log(JSON.stringify(jqXHR));
				}
			});
		},

		ConsultaOdata3: function () {
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			var region = appModulePath + '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata/solicitante';
			//console.log(region);
			//Consulta
			$.ajax({
				type: 'GET',
				url: region,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: true,
				success: function (dataR, textStatus, jqXHR) {
					//console.log("cliente");
					//console.log(dataR);
					var cliente = new sap.ui.model.json.JSONModel(dataR.d.results);

					oView.setModel(cliente, "cliente");
				},
				error: function (jqXHR, textStatus, errorThrown) {
					//console.log(JSON.stringify(jqXHR));
				}
			});
		},
		ConsultaOdata4: function () {
			var key = '%27' + oView.byId("cmbcliente").getSelectedKey() + '%27';
			var region = '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata/destinatario?$filter=SOLICITANTE%20eq%20';
			var url = region + key;
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			//console.log(region);
			//Consulta
			$.ajax({
				type: 'GET',
				url:appModulePath + url,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: true,
				success: function (dataR, textStatus, jqXHR) {
					//console.log("interlocutor");
					//console.log(dataR.d.results);
					var interlocutor = new sap.ui.model.json.JSONModel(dataR.d.results);

					oView.setModel(interlocutor, "interlocutor");
				},
				error: function (jqXHR, textStatus, errorThrown) {
					//console.log(JSON.stringify(jqXHR));
				}
			});
		},

		validarcant: function () {
			if (oView.byId("Products").getValue().toString().length >= 4) {
				t.ConsultaMaterial();
			}

		},
		ConsultaMaterial: function () {
			//	var key = oView.getDependents()[0]._searchField.getValue();

			//$filter=startswith(SKUNumber,%2787840%27)
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			var material = appModulePath + '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata/material?$top=600';

			// ?$filter=startswith(MATERIAL,%27'+ key +%27)';

			//Consulta
			$.ajax({
				type: 'GET',
				url: material,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: true,
				success: function (dataR, textStatus, jqXHR) {

					var material = new sap.ui.model.json.JSONModel(dataR.d.results);
					oView.setModel(material, "material");
				},
				error: function (jqXHR, textStatus, errorThrown) {
					//console.log(JSON.stringify(jqXHR));
				}
			});
		},
		ConsultaMaterial2: function () {
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            var appModulePath = jQuery.sap.getModulePath(appid);
			var key = oView.getDependents()[0]._searchField.getValue().toUpperCase();
			oView.getDependents()[0]._searchField.setValue(key)
			var material = '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata/material?$top=600&$filter=startswith(MATERIAL,%27' + key +
				'%27)';

			//Consulta
			$.ajax({
				type: 'GET',
				url:appModulePath +  material,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: true,
				success: function (dataR, textStatus, jqXHR) {
					//console.log(dataR);
					var material = new sap.ui.model.json.JSONModel(dataR.d.results);
					oView.setModel(material, "material");
				},
				error: function (jqXHR, textStatus, errorThrown) {
					//console.log(JSON.stringify(jqXHR));
				}
			});
		},
		mayuscula: function (oEvent) {
			var txt = oEvent.getSource();
			txt.setValue(txt.getValue().toUpperCase());

		},
		handleMaterialesValueHelp: function(oEvent){
			var oProps = {
				oControl: oEvent.getSource(),
				oModel: this._oDataHanaModel,
				sEntity: "/material",
				basicSearch: false,
				aCols: [
					{
						// label: this.getText('MATERIAL'),
						label: 'MATERIAL',
						template: "MATERIAL",
						width: "10rem",
						filtrable: true,
						key: true,
						descriptionKey: "DESCRIPCION"
					},
					{
						// label: this.getText('DESCRIPCION'),
						label: 'DESCRIPCION',
						template: "DESCRIPCION",
						filtrable: "true",
					}
				]
			}
			var oVH = new ValueHelp( oProps );
			oVH.open()
		},
		handleValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();

			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.DialogV",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}

			this._valueHelpDialog.open(sInputValue);
		},

		_handleValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},

		Destinatario: function (id) {
			var regex, m;
			regex = /(\.\d+)|\B(?=(\d{3})+(?!\d))/g;
			if (id !== null) {
				var json = {
					"CreditoClienteSet": {
						"CreditoCliente": {
							"Cliente": oView.byId("cmbcliente").getSelectedKey(),
								"Proceso": "R"
						}
					}
				};
				//Consulta
				//AR_DP_DEST_CPI
				//AR_DP_DEST_ODATA  principal propagetion
                var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
				$.ajax({
					type: 'POST',
					url: appModulePath + '/destinations/AR_DP_DEST_CPI/http/AR/DealerPortal/Pedido/LimiteCredito',
					contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					async: true,
					data: JSON.stringify(json),
					success: function (dataR, textStatus, jqXHR) {
						t.ConsultaOdata4();
						var tcredito = 0;
						tcredito = Number(dataR.CreditoClienteSet.CreditoCliente.Credito);
						m = Math.round(tcredito);
						m = m.toString();
						m = m.replace(regex, ".");

						oView.byId("labelcredito").setText("Límite de Crédito : $" + m);
					},
					error: function (jqXHR, textStatus, errorThrown) {
						var arr = [];
						//console.log(JSON.stringify(jqXHR));
						var obj = {
							codigo: "01",
							descripcion: "Existe un problema de comunicación favor contactar a soporte "
						};
						arr.push(obj);
						t.popError(arr, "Error");
					}
				});
			}
		},
		isExist: function (mat, cant) {
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			var material = '/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata/material?$top=600&$filter=startswith(MATERIAL,%27' + mat +
				'%27)',
				cantT = cant;
			//Consulta
			$.ajax({
				type: 'GET',
				url:appModulePath + material,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: false,
				success: function (dataR, textStatus, jqXHR) {
					// //console.log(dataR);
					if (dataR.d.results.length !== 0) {
						if (parseInt(cant, 10) < parseInt(dataR.d.results[0].CANTMIN, 10)) {

							cantT = (dataR.d.results[0].CANTMIN);
						} else if (parseInt(cant, 10) > parseInt(dataR.d.results[0].CANTMIN, 10)) {
							for (var i = 0; i < cant; i++) {
								if (dataR.d.results[0].MVENTA * i < cant) {
									// //console.log(multiplo * i);
								} else {
									cantT = dataR.d.results[0].MVENTA * i;
									i = cant + 1;
								}
							}
						}
					} else {
						cantT = -2;
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					//console.log(JSON.stringify(jqXHR));
				}
			});
			return cantT;
		},
		ConsultaStock: function () {
			t.popCarga();
			var result = [],
				flagT = true, //****
				cantidadT = 0,
				resultT = []; //***
			var json2 = oView.getModel("listadoMateriales").oData; //**linea 73
			//INICIO
			//Totalizar lineas y cantidades 
			//antes de virificar disponibilidad y existenciar
			for (var i = 0; i < json2.length; i++) {
				for (var j = 0; j < resultT.length; j++) {
					if (json2[i].material === resultT[j].material) {
						flagT = false;
						j = resultT.length + 1;
					}
				}
				if (flagT) {
					var arrn = {
						"material": json2[i].material,
						"cliente": "",
						"cantPed": json2[i].cantidad
					};
					resultT.push(arrn);
				}
				flagT = true;
			}
			console.log(resultT);
			//***hasta aqui
			//totalizar******

			for (var i = 0; i < resultT.length; i++) {
				cantidadT = 0;
				var cant = 0;
				for (var j = 0; j < json2.length; j++) {
					if (json2[j].material === resultT[i].material) {
						cantidadT = cantidadT + parseInt(json2[j].cantidad, 10);
						cant = cant + 1;
					}

				}

				var arrnT = {
					"Material": resultT[i].material,
					"Cliente": "",
					"CantPed": cantidadT,
					"cant": cant

				};
				cantorg.push(arrnT);
				console.log(cantorg);
				//desde aqui
				if (t.isExist(resultT[i].material, cantidadT) !== -2) {
					var arrnTn = {
						"Material": resultT[i].material,
						"Cliente": "",
						"CantPed": t.isExist(resultT[i].material, cantidadT)
					};
					result.push(arrnTn);
				}

			}
			console.log(result);
			if (result.length === 0) {
				var arrnTn = {
					"Material": "",
					"Cliente": "",
					"CantPed": ""
				};
				result.push(arrnTn);
			}
			//hasta aqui

			///********************fin totalizar *****************
			//FIN
			console.log(result);
			var json = {
				"HeaderSet": {
					"Header": {
						"Cliente": "",
						"Nav_Header_Stock_2": {
							"Stock": result
						}
					}

				}
			};
			// var json = {
			// 	"root": {
			// 		"stock": result
			// 	}
			// };

			arrjson = JSON.stringify(json);
			console.log(arrjson);
			var url = '/destinations/AR_DP_DEST_CPI/http/AR/DealerPortal/Pedido/VerificarStock';
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            var appModulePath = jQuery.sap.getModulePath(appid);
			console.log("crearPedidoUrgente appModulePath:", appModulePath);
			$.ajax({
				type: 'POST',
				url:appModulePath + url,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: true,
				data: arrjson,
				timeout: 180000,
				success: function (dataR, textStatus, jqXHR) {
					t.cerrarPopCarga2();
					console.warn(dataR);
					Respuesta = dataR;
					t.Verificado();
					//	t.GenerarVerificado(dataR);

				},
				error: function (jqXHR, textStatus, errorThrown) {
					t.cerrarPopCarga2();
					var arr = [];
					console.log(JSON.stringify(jqXHR));
					var obj = {
						codigo: "01",
						descripcion: "Existe un problema de comunicación favor contactar a soporte "
					};
					arr.push(obj);
					t.popError(arr, "Error");
				}

			});

		},
		goToNewView: function () {

			var oDialog = oView.byId("app");
			// create dialog lazily

			// create dialog via fragment factory
			oDialog = sap.ui.xmlview(oView.getId(), "AR_DP_REP_EDIDO.AR_DP_REP_PEDIDO_RASA.view.LaunchPadPedido", this);
			oView.addDependent(oDialog);

			oDialog.open();

		},
		atras: function () {
			var oRouter =
				sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("menuprincipal");
			t.limpieza();
		},
		onNavBack: function () {
			history.go(-1);
		},

		Verificado: function () {
			var ID_SOLICITANTE = oSAPuser;
			var a = oView.byId("cmbcliente").getSelectedKey();
			var b = oView.byId("Pdealer").getValue();
			var c = oView.byId("interlocutor").getSelectedKey();
			var d = oView.getModel("listadoMateriales").oData;
			var e = cantorg;
			var f = flagperfil;
			console.log(cantorg);
			console.log(oView.getModel("listadoMateriales").oData);
			sap.ui.controller("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.VerificadoUrgente").jsoncreacion(ID_SOLICITANTE, a, b, c, d, e, f);
			// var oRouter =
			// 	sap.ui.core.UIComponent.getRouterFor(this);
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("VerificadoUrgente", {
				data: JSON.stringify(Respuesta)
			});
			this.limpieza();

		},
		//popUp tipo 1 
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
		popformulario: function () {
			var oDialog = oView.byId("Formulario");

			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.formulario", this);
				oView.addDependent(oDialog);
				this.getView().byId("Formulario").addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}
			oView.byId("tPago");
			oDialog.open();
		},
		aceptarDialogPago: function () {
			this.getView().byId("Formulario").close();
		},
		onCloseDialogPago: function () {

			this.getView().byId("Formulario").close();
		},
		cerrarPopCarga: function () {
			this.getView().byId("Formulario").close();
		},

		limpieza: function () {
			oView.byId("material").setValue();
			oView.byId("Cantidad").setValue();
			//INICIO
			this.getView().byId("uplExcel").clear();
			oView.byId("labelcredito").setText("Límite de Crédito : $")
				//FIN
			oView.byId("Pdealer").setValue();
			oView.byId("interlocutor").setSelectedKey();
			//	oSAPuser = "";
			data = "";
			arrjson = "";
			Respuesta = [];
			mnext = [];
			cantorg = [];
			var arryt = [];
			var dataT = new sap.ui.model.json.JSONModel(arryt);
			oView.setModel(dataT, "listadoMateriales");
			//console.log(oView.byId("Pdealer").getValue() + "," + oView.byId("interlocutor").getSelectedKey() + "," + data + "," + arrjson);

		}

	});

});