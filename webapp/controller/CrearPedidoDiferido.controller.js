sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/core/Fragment',
	'sap/ui/model/Filter',
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Dialogs/ValueHelpDialogMateriales",
	"AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Utils",
	"../utils/ValueHelp"
], function (Controller, Fragment, Filter, FilterOperator, MessageBox, ValueHelpDialogMateriales, Utils,ValueHelp) {
	"use strict";
	
	let that;
	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.CrearPedidoDiferido", {
		
		onInit: function () {
			that = this;
			
			jQuery.sap.require("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.js.jszip");
			jQuery.sap.require("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.js.xlsx");
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());//TODO Revisar la necesidad de esta linea
			
			this._localModel = this.getOwnerComponent().getModel();
			this._oDataHanaModel = this.getOwnerComponent().getModel("ODataHana");
			
			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("CrearPedidoDiferido").attachMatched(this._onRouteMatched, this);
		},
		
		_onRouteMatched: function(oEvent){
			let fromRoute = sap.ui.core.routing.History.getInstance().getPreviousHash();
			if(fromRoute == "" || fromRoute == "menuprincipal"){
				this.setModelInitialData();
				this.setBusyDialog(true);
				
				let dfdUserRoleCheck = $.Deferred();
				let dfdCurrentUserIASData = Utils.loadCurrentUserIASData();
				let dfdIsCurrentUserANissanUser = Utils.isCurrentUserANissanUser();
				let dfdSolicitantes = this.loadSolicitantes();
				//this.loadMateriales(true);
				
				$.when(dfdCurrentUserIASData, dfdIsCurrentUserANissanUser).then(function(currentUserDataIAS, isNissanUser){
					if(!isNissanUser){
						that.setUserAsSolicitante(currentUserDataIAS);
						that._localModel.setProperty("/Pedido/Solicitante/Editable", false);
						
						that.loadSolicitanteDependantData().then(dfdUserRoleCheck.resolve);
					}else{
						dfdUserRoleCheck.resolve();
					}
				});
				
				$.when(dfdUserRoleCheck, dfdSolicitantes).then(function(){
					that.setBusyDialog(false)
				});
			}
		},
		
		setModelInitialData: function(){
			let fechaHoy = new Date();
			
			this._localModel.setProperty("/Solicitantes", [])
			this._localModel.setProperty("/Destinatarios", [])
			this._localModel.setProperty("/Materiales", {})
			this._localModel.setProperty("/LimiteDeCredito", 0)
			this._localModel.setProperty("/Pedido", {
				Solicitante: {
					Valor: "",
					Editable: true
				},
				PedidoDealer: {
					Valor: "",
					Editable: true
				},
				Destinatario: {
					Valor: "",
					Editable: true
				},
				FechaEntrega: {
					Valor: "",
					FechaMinima: fechaHoy,
					Estado: "None",
					Editable: true
				},
				ListaMateriales: {
					IndiceSiendoEditado: -1,
					ValorPorAgregar:{
						Material: "",
						Cantidad: 0
					},
					Valor: [],
					Editable: true
				},
				ListaDestinatarios: {
					Valor:"",
					Editable: true
				}
			});
		},
		loadSolicitanteDependantData: function(){
			let dfdSolicitanteDependantData = $.Deferred();
			this.setBusyDialog(true);
			
			let solicitante = this._localModel.getProperty("/Pedido/Solicitante/Valor");
			
			let dfdDestinatarios = that.loadDestinatarios(solicitante);
			let dfdLimiteCredito = that.loadLimiteCredito(solicitante);
			
			$.when(dfdDestinatarios, dfdLimiteCredito).then(function(){
				dfdSolicitanteDependantData.resolve();
				that.setBusyDialog(false);
			});
			
			return dfdSolicitanteDependantData;
		},
		loadSolicitantes: function(){
			let dfdSolicitantes = $.Deferred();
			this._oDataHanaModel.read("/solicitante", {
				success: function(datos){
					that._localModel.setProperty("/Solicitantes", datos.results);
					
					dfdSolicitantes.resolve();
				},
				error: function(){
					MessageBox.error("Error al cargar los solicitantes, contacte a soporte.",{
						title: "Error de comunicación"
					});
				}
			});	
			
			return dfdSolicitantes;
		},
		loadMateriales: function(aFilters){

			let dfdMateriales = $.Deferred();
			this._oDataHanaModel.read("/material", {
				filters:aFilters,
				success: function(datos){
					that._localModel.setProperty("/Materiales/Valor", datos.results);
					
					dfdMateriales.resolve();
				},
				error: function(){
					MessageBox.error("Error al cargar los materiales, contacte a soporte.",{
						title: "Error de comunicación"
					});
				}
			},);	
			
			this._localModel.setProperty("/Materiales", {
				Valor: [],
				Promesa: dfdMateriales
			});
			
			return dfdMateriales;
		},
		
		getToken: function () {
			let dfdToken = $.Deferred();
			var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			$.ajax({
				type: 'GET',
				url: appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CHECK_CREDITO_SRV;v=1;o=AR_DP_ERP_OP_USER_COM',
				headers: {
					"X-CSRF-Token": "Fetch"
				},
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				success: function (dataR, textStatus, jqXHR) {
					dfdToken.resolve(jqXHR.getResponseHeader('X-CSRF-Token'))
				},
				error: function (jqXHR, textStatus, errorThrown) {
					dfdToken.resolve(jqXHR.getResponseHeader('X-CSRF-Token'))
				}
			});
			
			return dfdToken;
		},
		loadLimiteCredito: function(solicitante){
			let dfdLimiteCredito = $.Deferred(); 
			let appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
			let appModulePath = jQuery.sap.getModulePath(appid);
		
			let parameters = {
				"Cliente": solicitante,
				"Proceso": "R"
			};
			
			this.getToken().then(function(token){

				$.ajax({
					type: 'POST',
					url: appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CHECK_CREDITO_SRV;v=1;o=AR_DP_ERP_OP_USER_COM/CreditoClienteSet',
					headers: {
						"X-CSRF-Token": token
					},
					contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					data: JSON.stringify(parameters),
					success: function (dataR, textStatus, jqXHR) {
						let limiteCredito = dataR.d.Credito;
						that._localModel.setProperty("/LimiteDeCredito", that.formatLimiteCredito(limiteCredito));
						
						dfdLimiteCredito.resolve();
					},
					error: function (jqXHR, textStatus, errorThrown) {
						MessageBox.error("Error al obtener limite de credito, contacte a soporte.",{
							title: "Error de comunicación"
						});
					}
				});
			});
			
			
			return dfdLimiteCredito;
		},
		formatLimiteCredito: function(limiteCredito){
			var regex, m;
			regex = /(\.\d+)|\B(?=(\d{3})+(?!\d))/g;
			
			limiteCredito = Number(limiteCredito);
			limiteCredito = Math.round(limiteCredito);
			limiteCredito = limiteCredito.toString();
			limiteCredito = limiteCredito.replace(regex, ".");
			
			return limiteCredito;
		},
		setUserAsSolicitante: function(currentUserIASData){
			if(currentUserIASData["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"]){
				let atributosUsuario = currentUserIASData["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes;
				let codigoSucursal = atributosUsuario.find(attribute => attribute.name == "customAttribute6").value
				
				if(codigoSucursal){
					this._localModel.setProperty("/Pedido/Solicitante/Valor", "0000" + codigoSucursal);
				}
			}
		},
		loadDestinatarios: function(solicitante){
			let dfdDestinatarios = $.Deferred();
			
			let filters = [];
			if(solicitante){
				filters.push(new Filter("SOLICITANTE", FilterOperator.EQ, solicitante));
			}
			
			this._oDataHanaModel.read("/destinatario", {
				filters: filters,
				success: function(datos){
					that._localModel.setProperty("/Destinatarios", datos.results);
					dfdDestinatarios.resolve();
				},
				error: function(){
					MessageBox.error("Error al cargar los destinatarios, contacte a soporte.",{
						title: "Error de comunicación"
					});
				}
			});	
			
			return dfdDestinatarios;
		},
		
		addOrEditMaterialPedido: function(){
			let datosListaMaterialesPedido = this._localModel.getProperty("/Pedido/ListaMateriales");
			let indiceRowSiendoEditada = datosListaMaterialesPedido.IndiceSiendoEditado;
			let materialAgregar = datosListaMaterialesPedido.ValorPorAgregar;
			let listaMateriales = datosListaMaterialesPedido.Valor;
			
			if(materialAgregar.Material && materialAgregar.Cantidad > 0){
				if(indiceRowSiendoEditada >= 0){
					listaMateriales[indiceRowSiendoEditada] = materialAgregar;
					datosListaMaterialesPedido.IndiceSiendoEditado = -1;
				}else{
						listaMateriales.push(materialAgregar);
				}
				
				this._localModel.setProperty("/Pedido/ListaMateriales/ValorPorAgregar", {
					Material: "",
					Cantidad: 0
				});
			}
		},
		editModeMaterialEnPedido: function(oEvent){
			let contextPathAListaMaterialesRow = oEvent.getSource().getParent().getBindingContextPath();
			let rowAEditar = this._localModel.getProperty(contextPathAListaMaterialesRow);
			let indiceRowListaDeMateriales = contextPathAListaMaterialesRow.split("/")[4];
			
			this._localModel.setProperty("/Pedido/ListaMateriales/ValorPorAgregar", {
				Material: rowAEditar.Material,
				Cantidad: rowAEditar.Cantidad
			});
			this._localModel.setProperty("/Pedido/ListaMateriales/IndiceSiendoEditado", indiceRowListaDeMateriales);
		},
		deleteMaterialDePedido: function(oEvent){
			let indiceSiendoEditado = this._localModel.getProperty("/Pedido/ListaMateriales/IndiceSiendoEditado");
			if(indiceSiendoEditado == -1){
				let contextPathAListaMaterialesRow = oEvent.getSource().getParent().getBindingContextPath();
				let indiceRowListaDeMateriales = contextPathAListaMaterialesRow.split("/")[4];
				
				let listaMateriales = this._localModel.getProperty("/Pedido/ListaMateriales/Valor");
				listaMateriales.splice(indiceRowListaDeMateriales, 1);
				
				this._localModel.refresh();
			} else {
				MessageBox.warning("Debe terminar de editar antes de poder eliminar entrada.",{
						title: "Advertencia"
					});
			}
		},
		
		
		onSubirArchivo: function (oEvent) {
			let	file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
			let indiceEditandoListaMateriales = this._localModel.getProperty("/Pedido/ListaMateriales/IndiceSiendoEditado");
			
			if(indiceEditandoListaMateriales >= 0){
				MessageBox.warning("Debe terminar de editar antes de subir el archivo con materiales.",{
					title: "Advertencia"
				});
			} else {
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
						
						wb.SheetNames.forEach(function (sheetName) {
							wb.Sheets[sheetName].A1.h = "Material";
							wb.Sheets[sheetName].A1.r = "<t>Material</t>";
							wb.Sheets[sheetName].A1.v = "Material";
							wb.Sheets[sheetName].A1.w = "Material";
		
							wb.Sheets[sheetName].B1.h = "Cantidad";
							wb.Sheets[sheetName].B1.r = "<t>Cantidad</t>";
							wb.Sheets[sheetName].B1.v = "Cantidad";
							wb.Sheets[sheetName].B1.w = "Cantidad";
							
							var rows = XLS.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
							if (rows.length > 0) {
								let cantidadMateriales = that.contarMateriales(rows);
								let listaMateriales = that._localModel.getProperty("/Pedido/ListaMateriales/Valor");
								
								for(let numeroMaterial in cantidadMateriales){
									if (cantidadMateriales.hasOwnProperty(numeroMaterial)) {
										listaMateriales.push({
											Material: numeroMaterial,
											Cantidad: cantidadMateriales[numeroMaterial]
										});
									}
								}
								
								that._localModel.refresh();
							}
						});
					};
					
					reader.readAsBinaryString(file);
				}
			}
		},
		contarMateriales: function (rows) {
			let cantidadMateriales = {};
			
			for(let row of rows){
				cantidadMateriales[row.Material] = cantidadMateriales[row.Material] ? cantidadMateriales[row.Material] : 0;
				cantidadMateriales[row.Material] += parseInt(row.Cantidad, 10);
			}
			
			return cantidadMateriales;
		},
		
		validarCamposPreVerificarStock: function(){
			let pedido = that._localModel.getProperty("/Pedido");
			//that.navToVerificadoDiferido();
			if (!pedido.Solicitante.Valor || !pedido.PedidoDealer.Valor || 
				!pedido.Destinatario.Valor || (!pedido.FechaEntrega.Valor || pedido.FechaEntrega.Estado == "Error")) {
				MessageBox.warning("Los campos Solicitante, Pedido Dealer, Destinatario y Fecha de Entrega deben ser completados para continuar.", {
					title: "Advertencia"
				});
			} else if(pedido.ListaMateriales.Valor.length == 0) {
				MessageBox.warning("Se debe cargar al menos un material para continuar.", {
					title: "Advertencia"
				});
			} else {
				this.verificarStock(pedido.Solicitante.Valor);
			}
		},
		verificarStock: async function(solicitante){
			let that = this;
			let listaMaterialesFormateada = await this.getListaMaterialesFormateada(solicitante);
			
			if(listaMaterialesFormateada.length == 0){
				MessageBox.error("Los materiales ingresados no son validos.");
				return;
			}
			
			this.popCarga();
			
			let parameters = JSON.stringify({
				"Cliente": "",
				"Nav_Header_Stock_2": listaMaterialesFormateada
			});
			
			this.getToken().then(function(token){
                var appid = that.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  				var appModulePath = jQuery.sap.getModulePath(appid);
				$.ajax({
					type: 'POST',
					url: appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_4_SRV;v=1;o=AR_DP_ERP_OP_USER_COM/HeaderSet',
					headers: {
						"X-CSRF-Token": token
					},
					contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					data: parameters,
					timeout: 360000,
					success: function (dataR, textStatus, jqXHR) {
						let respuestaSolicitudAStock = dataR.d.Nav_Header_Stock_2.results;
						that._localModel.setProperty("/RespuestaSolicitudAStock", respuestaSolicitudAStock)
						that.cerrarPopCarga();
						that.navToVerificadoDiferido();
					},
					error: function (jqXHR, textStatus, errorThrown) {
						MessageBox.error("Error al verificar el stock, vuelva intentar. \n Si luego de varios intentos el error persiste, contacte a soporte..",{
							title: "Error de comunicación"
						});
						that.cerrarPopCarga();
					}
				});
			});
		},
		
		getListaMaterialesFormateada: async function(solicitante){

			let listaMaterialesSeleccionados = this._localModel.getProperty("/Pedido/ListaMateriales/Valor");
			if (!listaMaterialesSeleccionados.length) return; 
			var aFiltros = listaMaterialesSeleccionados.map (oMaterial => new sap.ui.model.Filter("MATERIAL", sap.ui.model.FilterOperator.EQ, oMaterial.Material));
			await this.loadMateriales(aFiltros);
			let materiales = this._localModel.getProperty("/Materiales/Valor");

			let cantidadesMateriales = this.contarMateriales(listaMaterialesSeleccionados);
			
			let listaMaterialesFormateada = [];
			let datosMaterialesSeleccionados = {};
			
			for(let numeroMaterial in cantidadesMateriales){
				if (cantidadesMateriales.hasOwnProperty(numeroMaterial)) {
					let cantidadMaterial = cantidadesMateriales[numeroMaterial];
					let datosMaterial = materiales.find(material => material.MATERIAL == numeroMaterial);
					if(datosMaterial){
						let cantidadMinima = datosMaterial.CANTMIN;
						let multiploDeVenta = datosMaterial.MVENTA;
						
						datosMaterialesSeleccionados[numeroMaterial] = {...datosMaterial, CantPedAjustado: false};
						
						if(cantidadMaterial < cantidadMinima){
							cantidadMaterial = cantidadMinima;
							
							datosMaterialesSeleccionados[numeroMaterial].CantPedAjustado = true;
						} else if(multiploDeVenta != 0){
							//cantidad = multiplo de multiploDeVenta inmediatamente superior a cantidadMaterial
							//para esto obtengo el resto de dividirlo entre multiploDeVenta (diferenciaHastaMultiplo)
							//si diferenciaHastaMultiplo es cero entonces cantidadMaterial ya es multiplo
							//sino le sumo lo necesario para que alcance el multiplo mayor mas inmediato (multiplodeVenta - diferenciaHastaMultiplo)
							let diferenciaHastaMultiplo = cantidadMaterial % multiploDeVenta;
							cantidadMaterial += diferenciaHastaMultiplo !== 0 ? multiploDeVenta - diferenciaHastaMultiplo : 0;
							
							datosMaterialesSeleccionados[numeroMaterial].CantPedAjustado = true;
						}
						
					}
					
					listaMaterialesFormateada.push({
						"Material": numeroMaterial,
						"Cliente": solicitante,
						"CantPed": cantidadMaterial.toString()
					});
				}
			}
			
			this._localModel.setProperty("/Pedido/ListaMateriales/DatosMaterialesSeleccionados", datosMaterialesSeleccionados);
			
			return listaMaterialesFormateada;
		},
		
		navToVerificadoDiferido: function(){
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("VerificadoDiferido");
		},
		
		
		popCarga: function () {
			var oDialog = this.getView().byId("indicadorCarga");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(that.getView().getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.PopUp", this);
				that.getView().addDependent(oDialog);
			}
			oDialog.open();
		},
		cerrarPopCarga: function () {
			this.getView().byId("indicadorCarga").close();
		},
		
		navBack: function () {
			this._localModel.setProperty("/", {})
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("menuprincipal");
		},
		
		setBusyDialog: function(value){
			this._activeBusyDialogs = this._activeBusyDialogs ? this._activeBusyDialogs : 0;
			this._activeBusyDialogs += value ? 1 : -1;
			this.getView().setBusy(this._activeBusyDialogs != 0);
		},
		handleMaterialesValueHelp: function(oEvent){
			// let dfdMateriales = this.loadMateriales();
			
			// this.setBusyDialog(true);
			// $.when(dfdMateriales).then(function(){
			// 	ValueHelpDialogMateriales.open(that.getView(), false);
			// 	that.setBusyDialog(false);
			// });
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
		mayuscula: function (oEvent) {
			var txt = oEvent.getSource();
			txt.setValue(txt.getValue().toUpperCase());
		},
		controlFechaValida: function(oEvent){
			let datePicker = oEvent.getSource();
			if(datePicker.isValidValue()){
				this._localModel.setProperty("/Pedido/FechaEntrega/Estado", "None")
			}else{
				this._localModel.setProperty("/Pedido/FechaEntrega/Estado", "Error")
			}
		}

	});

});