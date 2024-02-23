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
		
	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.CrearPedidoKits", {
		
		onInit: function () {
			that = this;
			
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());//TODO Revisar la necesidad de esta linea
			
			this._localModel = this.getOwnerComponent().getModel();
			this._oDataHanaModel = this.getOwnerComponent().getModel("ODataHana");
			
			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("CrearPedidoKits").attachMatched(this._onRouteMatched, this);
		},
		
		_onRouteMatched: function(){
			let fromRoute = sap.ui.core.routing.History.getInstance().getPreviousHash();
			if(fromRoute == "" || fromRoute == "menuprincipal"){
				this.setBusyDialog(true);
				this.setModelInitialData();
				
				let dfdUserRoleCheck = $.Deferred();
				let dfdCurrentUserIASData = Utils.loadCurrentUserIASData();
				let dfdIsCurrentUserANissanUser = Utils.isCurrentUserANissanUser();
				let dfdSolicitantes = this.loadSolicitantes();
				// this.loadKits(true);
				
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
					that.setBusyDialog(false);
				});
			}
		},
		
		setModelInitialData: function(){
			this._localModel.setProperty("/Solicitantes", []);
			this._localModel.setProperty("/Destinatarios", []);
			this._localModel.setProperty("/Materiales", {});
			this._localModel.setProperty("/LimiteDeCredito", 0);
			this._localModel.setProperty("/MaterialesBOMKit", {})
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
				ListaKits: {
					IndiceSiendoEditado: -1,
					ValorPorAgregar:{
						Kit: "",
						Cliente: "",
						Dominio: "",
						Comentario: ""
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
		loadKits: function(force){
			let objectMateriales = this._localModel.getProperty("/Materiales");
			
			if(!objectMateriales.Promesa || force){
				let dfdMateriales = $.Deferred();
				
				let filters = [];
				filters.push(new Filter("KIT", FilterOperator.EQ, 1));
				
				this._oDataHanaModel.read("/material", {
					filters: filters,
					success: function(datos){
						that._localModel.setProperty("/Materiales/Valor", datos.results);
						
						dfdMateriales.resolve();
					},
					error: function(e){
						MessageBox.error("Error al cargar Kits, contacte a soporte.",{
							title: "Error de comunicación"
						});
					}
				});
				
				this._localModel.setProperty("/Materiales", {
					Valor: [],
					Promesa: dfdMateriales
				});
				
				return dfdMateriales;
			}else{
				return objectMateriales.Promesa;
			}
		},
		loadLimiteCredito: function(solicitante){
			let that = this;
			let dfdLimiteCredito = $.Deferred(); 
		
			let parameters = {
				"Cliente": solicitante,
				"Proceso": "R"
			};
			
			this.getToken().then(function(token){
                var appid = that.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  				var appModulePath = jQuery.sap.getModulePath(appid);
				$.ajax({
					type: 'POST',
					url:appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CHECK_CREDITO_SRV;v=1;o=AR_DP_ERP_OP_USER_COM/CreditoClienteSet',
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
					MessageBox.error("Error al cargar destinatarios, contacte a soporte.",{
						title: "Error de comunicación"
					});
				}
			});	
			
			return dfdDestinatarios;
		},
		
		addOrEditKitPedido: function(){
			let datosListaKitsPedido = this._localModel.getProperty("/Pedido/ListaKits");
			let indiceRowSiendoEditada = datosListaKitsPedido.IndiceSiendoEditado;
			let kitAgregar = datosListaKitsPedido.ValorPorAgregar;
			let listaKits = datosListaKitsPedido.Valor;
			
			if(!this.existeKit(kitAgregar.Kit)){
				MessageBox.warning("Kit no existente.", {
					title: "Adventencia"
				});
				return;
			}
			
			if(kitAgregar.Kit && kitAgregar.Cliente && kitAgregar.Dominio && kitAgregar.Comentario){
				if(indiceRowSiendoEditada >= 0){
					listaKits[indiceRowSiendoEditada] = kitAgregar;
					datosListaKitsPedido.IndiceSiendoEditado = -1;
				}else{
					listaKits.push(kitAgregar);
				}
				this.loadBOM(kitAgregar.Kit);//Precargo el BOM del kit
				
				this._localModel.setProperty("/Pedido/ListaKits/ValorPorAgregar", {
					Kit: "",
					Cliente: "",
					Dominio: "",
					Comentario: ""
				});
			}else{
				MessageBox.warning("Complete los campos Kit, Cliente, Dominio y Comentario para agregar el material.",
				{
					title: "Advertencia"
				})
			}
		},
		existeKit: function(idKitEnDuda){
			let listaKits = this._localModel.getProperty("/Materiales/Valor");
			for(let datosKit of listaKits){
				if(datosKit.MATERIAL == idKitEnDuda)
					return true;
			}
			
			return false;
		},
		editModeKitEnPedido: function(oEvent){
			let contextPathAListaKitsRow = oEvent.getSource().getParent().getBindingContextPath();
			let rowAEditar = this._localModel.getProperty(contextPathAListaKitsRow);
			let indiceRowListaDeKits = contextPathAListaKitsRow.split("/")[4];
			
			this._localModel.setProperty("/Pedido/ListaKits/ValorPorAgregar", {
					Kit: rowAEditar.Kit,
					Cliente: rowAEditar.Cliente,
					Dominio: rowAEditar.Dominio,
					Comentario: rowAEditar.Comentario
				});
			this._localModel.setProperty("/Pedido/ListaKits/IndiceSiendoEditado", indiceRowListaDeKits);
		},
		deleteKitDePedido: function(oEvent){
			let indiceSiendoEditado = this._localModel.getProperty("/Pedido/ListaKits/IndiceSiendoEditado");
			if(indiceSiendoEditado == -1){
				let contextPathAListaKitsRow = oEvent.getSource().getParent().getBindingContextPath();
				let indiceRowListaDeKits = contextPathAListaKitsRow.split("/")[4];
				
				let listaKits = this._localModel.getProperty("/Pedido/ListaKits/Valor");
				listaKits.splice(indiceRowListaDeKits, 1);
				
				this._localModel.refresh();
			} else {
				MessageBox.warning("Debe terminar de editar antes de poder eliminar entrada.",{
						title: "Advertencia"
					});
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
			
			if (!pedido.Solicitante.Valor || !pedido.PedidoDealer.Valor || !pedido.Destinatario.Valor) {
				MessageBox.warning("Los campos Solicitante, Pedido Dealer y Destinatario deben ser completados para continuar.", {
					title: "Advertencia"
				});
			} else if(pedido.ListaKits.Valor.length == 0) {
				MessageBox.warning("Se debe cargar al menos un material para continuar.", {
					title: "Advertencia"
				});
			} else {
				this.verificarStock(pedido.Solicitante.Valor);
			}
		},
		verificarStock: function(solicitante){
			let listaMaterialesEnKits = this.getListaMaterialesEnKits(solicitante);
			
			if(listaMaterialesEnKits.length == 0){
				MessageBox.error("No se encontraron materiales en los kits seleccionados.");
				return;
			}
			
			this.popCarga();
			
			let parameters = JSON.stringify({
				"Cliente": "",
				"Nav_Header_Stock_2": listaMaterialesEnKits
			});
			
			this.getToken().then(function(token){
                var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
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
						that.navToVerificadoKits();
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
		
		getListaMaterialesEnKits:function(solicitante){
			let materiales = this._localModel.getProperty("/Materiales/Valor");
			let listaKitsSeleccionados = this._localModel.getProperty("/Pedido/ListaKits/Valor");
			
			let listaMaterialesVerificar = {};
			
			for(let datosKit of listaKitsSeleccionados){
				let kitBOM = this._localModel.getProperty("/MaterialesBOMKit/" + datosKit.Kit + "/Valor");
				
				for(let datosMaterial of kitBOM){
					if(listaMaterialesVerificar[datosMaterial.Material]){
						listaMaterialesVerificar[datosMaterial.Material].CantPed += datosMaterial.Cantidad;
					}else{
						listaMaterialesVerificar[datosMaterial.Material] = {
							"Material": datosMaterial.Material,
							"Cliente": solicitante,
							"CantPed": datosMaterial.Cantidad.toString()
						};
					}
				}
			}
			
			return Object.values(listaMaterialesVerificar);	
		},
		
		openBOMPopUp: function(oEvent){
			this.setBusyDialog(true);

			let sourceButton = oEvent.getSource(),
				oView = this.getView();
			
			let kitModelPath = sourceButton.getParent().getBindingContextPath() + "/Kit"
			let kit = this._localModel.getProperty(kitModelPath);
			
			this.loadBOM(kit).then(function(error){
				if(!error){
					if (!this._BOMPopover) {
						this._BOMPopover = Fragment.load({
							id: oView.getId(),
							name: "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Dialogs.BOMPopOver",
							controller: this
						}).then(function(oPopover) {
							oView.addDependent(oPopover);
							return oPopover;
						});
					}
					this._BOMPopover.then(function(oPopover) {
						oPopover.bindElement("/MaterialesBOMKit/" + kit);
						oPopover.openBy(sourceButton);
					});
				}
				that.setBusyDialog(false);
			});
		},
		
		loadBOM: function(kit){
			let materialesBOMKit = this._localModel.getProperty("/MaterialesBOMKit");
			if(!materialesBOMKit[kit]){
				this._localModel.setProperty("/MaterialesBOMKit/" + kit, {
					Valor: [],
					Promesa: ""
				});
				
				let dfdBOMKit = $.Deferred();
				
				let parameters = {
					"Material": kit,
					"nav_header_detalle": [
						{
							"Material": kit
						}
					]
				};
				
				this.getToken().then(function(token){
                    var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
					$.ajax({
						type: 'POST',
						url:appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_29_SRV;v=1/HeaderSet',
						headers: {
							"X-CSRF-Token": token
						},
						contentType: 'application/json; charset=utf-8',
						dataType: 'json',
						data: JSON.stringify(parameters),
						success: function (dataR, textStatus, jqXHR) {
							debugger;
							let BOMKit = dataR.d.nav_header_detalle.results;
							BOMKit = BOMKit.filter(function(material){
								material.Cantidad = parseInt(material.Cantidad);
								return material.Material != kit;
							});
							
							that._localModel.setProperty("/MaterialesBOMKit/" + kit + "/Valor", BOMKit);
							dfdBOMKit.resolve(false)
						},
						error: function (jqXHR, textStatus, errorThrown) {
							MessageBox.error("Error al cargar componentes del kit, contacte a soporte.",{
								title: "Error de comunicación"
							});
							dfdBOMKit.resolve(true)
						}
					});
				});
			
				that._localModel.setProperty("/MaterialesBOMKit/" + kit + "/Promesa", dfdBOMKit);
				return dfdBOMKit;
			}else{
				return that._localModel.getProperty("/MaterialesBOMKit/" + kit + "/Promesa");
			}
		},
		
		navToVerificadoKits: function(){
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("VerificadoKits");
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
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("menuprincipal");
		},
		
		setBusyDialog: function(value){
			this._activeBusyDialogs = this._activeBusyDialogs ? this._activeBusyDialogs : 0;
			this._activeBusyDialogs += value ? 1 : -1;
			this.getView().setBusy(this._activeBusyDialogs != 0);
		},
		handleMaterialesValueHelp: function(oEvent){
			// let dfdKits = this.loadKits();
			
			// this.setBusyDialog(true);
			// $.when(dfdKits).then(function(){
			// 	ValueHelpDialogMateriales.open(that.getView(), true);
			// 	that.setBusyDialog(false);
			// });

			let aFilters = [];
			aFilters.push(new Filter("KIT", FilterOperator.EQ, 1));

			var oProps = {
				oControl: oEvent.getSource(),
				oModel: this._oDataHanaModel,
				sEntity: "/material",
				aFilters: aFilters,
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
		}

	});

});