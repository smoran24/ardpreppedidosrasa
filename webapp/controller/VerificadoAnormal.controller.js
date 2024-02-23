sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/Dialog",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/Link',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Utils',
	'AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Dialogs/ValueHelpDialogMaterialesRechazados'
], function (Controller, Dialog, MessageBox, MessageToast, MessagePopover, MessageItem, Link, JSONModel, Filter, Utils, ValueHelpMaterialesRechazados) {
	"use strict";
	
	let that;
	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.VerificadoAnormal", {
		onInit: function () {
			that = this;
			
			this._localModel = this.getOwnerComponent().getModel();
			this._oDataHanaModel = this.getOwnerComponent().getModel("ODataHana");
			
			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("VerificadoAnormal").attachMatched(this._onRouteMatched, this);
			
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},
			
		
		_onRouteMatched: function (oEvent) {
			this.processMaterialesVerificados();
			
			let dfdIsCurrentUserANissanUser = Utils.isCurrentUserANissanUser();
			$.when(dfdIsCurrentUserANissanUser).then(function(isNissanUser){
				that._localModel.setProperty("/Pedido/ListaMateriales/MostrarColumnaCantidadStock", isNissanUser);
			});
		},
		
		processMaterialesVerificados: function(){
			let materialesVerificadosStock = this._localModel.getProperty("/RespuestaSolicitudAStock");
			let datosMaterialesSeleccionados = this._localModel.getProperty("/Pedido/ListaMateriales/DatosMaterialesSeleccionados");
			
			let materialesVerificadosFormateados = [];
			let materialesNoExistentes = [];
			
			for(let materialVerificado of materialesVerificadosStock){
				if(materialVerificado.TipoMensaje == "E"){
					materialesNoExistentes.push(materialVerificado);
				} else {
					let datosMaterial = datosMaterialesSeleccionados[materialVerificado.Material];
					
					let iconoStock = "";
					let colorIconoStock = "";
					let cantidadAsignada = parseInt(materialVerificado.CantAsig, 10);
					let cantidadPedida = parseInt(materialVerificado.CantPed, 10);
					
					if(cantidadAsignada == cantidadPedida){
						iconoStock = 'sap-icon://status-positive';
						colorIconoStock = '#00c753';
					}else if(cantidadAsignada == 0){
						iconoStock = 'sap-icon://status-negative';
						colorIconoStock = '#e30000';
					}else if(cantidadAsignada < cantidadPedida){
						iconoStock = 'sap-icon://status-critical';
						colorIconoStock = '#ffbc05';
					}
					
					materialesVerificadosFormateados.push({
						Material: materialVerificado.Material,
						Recargo: Number(materialVerificado.Recargo),
						TipoMensaje: materialVerificado.TipoMensaje,
						PrecioVenta: Number(materialVerificado.PrecioVenta),
						Mensaje: materialVerificado.Mensaje,
						PrecioFinal: Number(materialVerificado.PrecioFinal),
						CantAsig: parseInt(materialVerificado.CantAsig, 10), //materialVerificado.CantAsig,
						Descuento: Number(materialVerificado.Descuento),
						Cliente: materialVerificado.Cliente,
						Precio: Number(materialVerificado.Precio),
						Cantidad: materialVerificado.CantPed, ///165463AW0J//0000136939
						Descripcion: datosMaterial.DESCRIPCION,
						CantMini: datosMaterial.CANTMIN,
						MVenta: datosMaterial.MVENTA,
						CantPedAjustado: datosMaterial.CantPedAjustado,
						StockIcono: iconoStock,
						StockColor: colorIconoStock,
						Unidad: "PC",
						BackOrder: true,
					});
				}
			}
			
			this._localModel.setProperty("/Pedido/ListaMateriales/Valor", materialesVerificadosFormateados);
			this._localModel.setProperty("/Pedido/ListaMateriales/ListaMaterialesSeleccionadosNoExistentes", materialesNoExistentes);	
		},
		
		handleValueHelpMaterialesRechazados: function(){
			ValueHelpMaterialesRechazados.open(this.getView());
		},
		
		generarPedido: function(){
			Utils.isCurrentUserANissanUser().then(function(isNissanUser){
				that.generarPedidoPorOData(isNissanUser).then(function(nroPedido){
					//TODO auditoria, todavia no poner en PRD
					that.generarEntradaAuditoria(nroPedido);
				});
			});
		},
		
		generarEntradaAuditoria: function(nroPedido){
			let dfdGenerarEntrada = $.Deferred();
			let isNissanUser = this._localModel.getProperty("/Pedido/ListaMateriales/MostrarColumnaCantidadStock");
			
			Utils.loadCurrentUserIASData().then(function(currentUserIAS){
				let identificador = {
					"Número pedido": nroPedido
				}
				
				let data = {
					ID_OBJETO: JSON.stringify(identificador),
					ID_ACCION: 7,
					TIPO_USUARIO: isNissanUser ? "N" : "D",
					USUARIO: currentUserIAS.id,
					NOMBRE_USUARIO: currentUserIAS.name.givenName + " " + currentUserIAS.name.familyName,
					FECHA: new Date()
				}
				
				that._oDataHanaModel.create("/EntradaAuditoria", data, {
					success: function (odata, oResponse) {
						dfdGenerarEntrada.resolve();
					}
				});
			});
			
			return dfdGenerarEntrada;
		},
		
		generarPedidoPorOData: function(usePP){
			let that = this;
			let dfdGenerarPedido = $.Deferred();
			let pedido = that._localModel.getProperty("/Pedido");
			
			if(!pedido.Destinatario.Valor){
				MessageBox.error("Debe ingresar el dato Destinatario para continuar.")
			}else{
				this.abrirPopCarga()
				
				let dfdListaMaterialesFormateada = this.getListaMaterialesFormateada(pedido);
				let dfdToken = this.getToken();
				
				$.when(dfdListaMaterialesFormateada, dfdToken).then(function(listaMaterialesFormateada, token){
					let serviceParameters = {
						"Cliente": "",
						"Nav_Header_Pedido": listaMaterialesFormateada
					};
					
					let urlCrearPedido = '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CREAR_PEDIDO_SRV';
					urlCrearPedido += usePP ? "" : ";o=AR_DP_ERP_OP_USER_COM";
					urlCrearPedido += "/HeaderSet";
					var appid = that.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  					var appModulePath = jQuery.sap.getModulePath(appid);
					$.ajax({
						type: 'POST',
						url:appModulePath + urlCrearPedido,
						headers: {
							"X-CSRF-Token": token
						},
						contentType: 'application/json; charset=utf-8',
						dataType: 'json',
						data: JSON.stringify(serviceParameters),
						timeout: 360000,
						success: function (dataR, textStatus, jqXHR) {
							that.cerrarPopCarga();
							
							if(dataR.d){
								let datosRespuesta = dataR.d.Nav_Header_Pedido.results.Mensaje ? 
													dataR.d.Nav_Header_Pedido.results :
													dataR.d.Nav_Header_Pedido.results[0]
													
								if(datosRespuesta.TipoMensaje == "S"){
									MessageBox.success(datosRespuesta.Mensaje, {
										onClose: that.navMenuPrincipal.bind(that)
									});
									
									let nroPedido = that.extraerNroPedido(datosRespuesta.Mensaje);
									dfdGenerarPedido.resolve(nroPedido);
								} else {
									MessageBox.error(datosRespuesta.Mensaje);
								}
							}else{
								MessageBox.error("Error al crear el pedido, vuelva intentar. \n Si luego de varios intentos el error persiste, contacte a soporte.");
							}
						},
						error: function (jqXHR, textStatus, errorThrown) {
							that.cerrarPopCarga();
	
							MessageBox.error("Error al crear el pedido, vuelva intentar. \n Si luego de varios intentos el error persiste, contacte a soporte.");
						}
					});
				});
			}
			
			return dfdGenerarPedido;
		},
		extraerNroPedido: function(mensaje){
			return mensaje.split(":")[1].trim();
		},
		
		getToken: function () {
			//Consulta
			let id = "";
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			$.ajax({
				type: 'GET',
				url:appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CREAR_PEDIDO_SRV',

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
		generarPedidoPorCPI: function(){
			let pedido = that._localModel.getProperty("/Pedido");
			if(!pedido.Destinatario.Valor){
				MessageBox.error("Debe ingresar el dato Destinatario para continuar.")
			}else{
				that.abrirPopCarga();
				
				let dfdListaMaterialesFormateada = this.getListaMaterialesFormateada(pedido);
				
				$.when(dfdListaMaterialesFormateada).then(function(listaMaterialesFormateada){
					let serviceParameters = {
						"HeaderSet": {
							"Header": {
								"Nav_Header_Pedido": {
									"Pedido": listaMaterialesFormateada
								}
							}
						}
					};
                    var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
                    var appModulePath = jQuery.sap.getModulePath(appid);	
					$.ajax({
						type: 'POST',
						url: appModulePath + '/destinations/AR_DP_DEST_CPI/http/AR/DealerPortal/Pedido/Creacion',
						contentType: 'application/json; charset=utf-8',
						dataType: 'json',
						data: JSON.stringify(serviceParameters),
						success: function (dataR, textStatus, jqXHR) {
							that.cerrarPopCarga();
							if(dataR.HeaderSet){
								let datosRespuesta =dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido.Mensaje ? 
													dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido :
													dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido[0]
													
								if(datosRespuesta.TipoMensaje == "S"){
									MessageBox.success(datosRespuesta.Mensaje, {
										onClose: that.navMenuPrincipal.bind(that)
									});
								} else {
									MessageBox.error(datosRespuesta.Mensaje);
								}
							}else{
								MessageBox.error("Error al crear el pedido, vuelva intentar. \n Si luego de varios intentos el error persiste, contacte a soporte.");
							}
						},
						error: function (jqXHR, textStatus, errorThrown) {
							that.cerrarPopCarga();
							MessageBox.error("Error al crear el pedido, vuelva intentar. \n Si luego de varios intentos el error persiste, contacte a soporte.");
						}
					});
				});

			}
		},
		getListaMaterialesFormateada: function(pedido){
			let dfdListaMaterialesFormateada = $.Deferred();
			let listaMateriales = pedido.ListaMateriales.Valor;
			let pedidoDealer = that.quitarGuinesFinales(pedido.PedidoDealer.Valor);
			
			let listaMaterialesFormateada = [];
			
			Utils.loadCurrentUserData().then(function(userData){
				for(let material of listaMateriales){
					let cantPedAEnviar = material.BackOrder ? material.Cantidad : material.CantAsig;
					
					listaMaterialesFormateada.push({
						"Cliente": pedido.Solicitante.Valor,
						"Dest": pedido.Destinatario.Valor,
						"PedWeb": pedidoDealer,
						"Tipo": "YNCA",
						"Material": material.Material,
						"CantPed": cantPedAEnviar.toString(),
						"Vin": pedido.VIN.Valor,
						"OrdRep": pedido.OR.Valor,
						"TipoMensaje": "",
						"Mensaje": "",
						"Usuario": userData.name
					});
				}
				
				dfdListaMaterialesFormateada.resolve(listaMaterialesFormateada);
			});
			
			return dfdListaMaterialesFormateada;
		},
		quitarGuinesFinales: function(pedidoDealer){
			debugger;
			let ultimoCaracterIndex;
			for(let i = pedidoDealer.length - 1; i >= 0; i--){
				if(pedidoDealer[i] != "_"){
					ultimoCaracterIndex = i;
					break;
				}
			}
			pedidoDealer = pedidoDealer.substring(0, ultimoCaracterIndex + 1);
			
			return pedidoDealer;
		},
		
		abrirPopCarga: function () {
			var oDialog = this.getView().byId("indicadorCarga");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(this.getView().getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.PopUp", this);
				this.getView().addDependent(oDialog);
			}
			oDialog.open();
		},
		cerrarPopCarga: function () {
			this.getView().byId("indicadorCarga").close();
		},
		
		navBack: function(){
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("CrearPedidoAnormal");	
		},
		
		cancelarPedido: function(){
			this.registrarDemanda();
			this.navMenuPrincipal();
		},
		navMenuPrincipal: function(){
			this._localModel.setProperty("/", {});
			
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("menuprincipal");
			
		},
		registrarDemanda: function () {
			let pedido = this._localModel.getProperty("/Pedido");
			let dfdCurrentUserData = Utils.loadCurrentUserData();
			
			$.when(dfdCurrentUserData).then(function(currentUserData){
				let data = {
					"ID_PEDIDO": 0,
					"ID_USUARIO_SCP": currentUserData.name,
					"FECHA": new Date(),
					"ID_SOLICITANTE": pedido.Solicitante.Valor,
					"ID_DESTINARIO": pedido.Destinatario.Valor,
					"ID_TIPOPEDIDO": "YNCA"
				};
				
				that._oDataHanaModel.create("/PedidoDemanda", data, {success: function (odata, oResponse) {
						that.registrarDetalleDeDemanda(odata.ID_PEDIDO, pedido.ListaMateriales.Valor);
					}
				});
			});
		},
		registrarDetalleDeDemanda: function (idPedidoDemanda, listaMateriales) {
			if(listaMateriales.length > 0){
				let batchOperations = [];
				let batchOperation = {};
				let batchOperationData = {};
				for(let material of listaMateriales){
					let batchOperationData = {
						"ID_PEDIDO": parseInt(idPedidoDemanda, 10).toString(),
						"MATERIAL": material.Material.toString(),
						"CANTPED": parseFloat(material.Cantidad.toString().replace(/\./g, ","), 2),
						"TIPO_MENSAJE": material.TipoMensaje,
						"RECARGO": parseFloat(material.Recargo.toString().replace(/\./g, ","), 2).toString(),
						"PRECIOVENTA": parseFloat(material.PrecioVenta.toString().replace(/\./g, ","), 2).toString(),
						"CANTASIG": parseFloat(material.CantAsig.toString().replace(/\./g, ","), 3).toString(),
						"DESCUENTO": parseFloat(material.Descuento.toString().replace(/\./g, ","), 2).toString(),
						"PRECIO": parseFloat(material.Precio, 2).toString()	
					};
					this._oDataHanaModel.create("/PedidoDemandaDetalle", batchOperationData);
				}
			}
		},
		
		handleDelete: function(oEvent){
			
			let contextPathAListaMaterialesRow = oEvent.getSource().getParent().getBindingContextPath();
			let indiceRowListaDeMateriales = contextPathAListaMaterialesRow.split("/")[4];
			
			let listaMateriales = this._localModel.getProperty("/Pedido/ListaMateriales/Valor");
			listaMateriales.splice(indiceRowListaDeMateriales, 1);
			
			this._localModel.refresh();
		}
	});
});