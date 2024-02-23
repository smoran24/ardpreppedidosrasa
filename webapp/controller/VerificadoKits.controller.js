sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	'sap/ui/core/Fragment',
	'AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Utils',
	'AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Dialogs/ValueHelpDialogMaterialesRechazados'
], function (Controller, MessageBox, Fragment, Utils, ValueHelpMaterialesRechazados) {
	"use strict";
	
	let that;
	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.VerificadoKits", {
		onInit: function () {
			that = this;
			
			this._localModel = this.getOwnerComponent().getModel();
			this._oDataHanaModel = this.getOwnerComponent().getModel("ODataHana");
			
			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("VerificadoKits").attachMatched(this._onRouteMatched, this);
			
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			that._oDataHanaModel.read("/DetalleKit");
		},
			
		
		_onRouteMatched: function (oEvent) {
			this.procesarKitsVerificadosVisualizacion();
			
			let dfdIsCurrentUserANissanUser = Utils.isCurrentUserANissanUser();
			$.when(dfdIsCurrentUserANissanUser).then(function(isNissanUser){
				that._localModel.setProperty("/Pedido/ListaKits/MostrarColumnaCantidadStock", isNissanUser);
			});
		},
		
		procesarKitsVerificadosVisualizacion: function(){
			let kitSeleccionados = this._localModel.getProperty("/Pedido/ListaKits/Valor");
			let BOMKits = this._localModel.getProperty("/MaterialesBOMKit");
			
			let requerimientosYStocks = this.getRequerimientosYStocks();
			let kitConPrioridad = this.getKitsConPrioridad(requerimientosYStocks);
			this.formatListaKitsVisualizacion(kitSeleccionados, kitConPrioridad);
			
			this._localModel.setProperty("/Pedido/ListaKits/Valor", kitSeleccionados);
		},
		
		getRequerimientosYStocks: function(){
			let kitSeleccionados = this._localModel.getProperty("/Pedido/ListaKits/Valor");
			let BOMKits = this._localModel.getProperty("/MaterialesBOMKit");
			
			let requerimientos = [];
			let stockMateriales = {};
			for(let kit of kitSeleccionados){
				let requerimiento = {
					kit: kit.Kit,
					materiales: {}
				};
				for(let material of BOMKits[kit.Kit].Valor){
					stockMateriales[material.Material] = this.getStockMaterial(material.Material);
					requerimiento.materiales[material.Material] = material.Cantidad
				}
				requerimientos.push(requerimiento);
			}
			
			return {
				requerimientos: requerimientos,
				stock: stockMateriales
			}
		},
		formatListaKitsVisualizacion: function(kits, kitsPrioritarios){
			
			for(let i = 0; i < kits.length; i++){
				let indexOfKitInKitPrioritarios = kitsPrioritarios.findIndex(kit => kit.kit == kits[i].Kit);
				
				if(indexOfKitInKitPrioritarios >= 0){
					kits[i].Stock = true;
					
					kits.splice(0, 0, kits[i]);
					kits.splice(i + 1, 1);
					
					kitsPrioritarios.splice(indexOfKitInKitPrioritarios, 1);
				}else{
					kits[i].Stock = false;
				}
			}
		},
		
		getStockMaterial: function(numeroMaterial){
			let materialesVerificadosStock = this._localModel.getProperty("/RespuestaSolicitudAStock");
			
			let i = 0;
			let materialVerificado;
			do{
				materialVerificado = materialesVerificadosStock[i];
				i++;
			}while(i < materialesVerificadosStock.length && materialVerificado.Material !== numeroMaterial)
			
			return parseInt(materialVerificado.CantAsig, 10);
		},
		
		handleValueHelpMaterialesRechazados: function(){
			ValueHelpMaterialesRechazados.open(this.getView());
		},
		
		generarPedidos: function(){
			let pedido = that._localModel.getProperty("/Pedido");
			if(!pedido.Destinatario.Valor){
				MessageBox.error("Debe ingresar el dato Destinatario para continuar.")
			}else{
				this.abrirPopCarga();
				
				let dfdsPedidos = [];
				let listaKits = pedido.ListaKits.Valor;
				
				Utils.isCurrentUserANissanUser().then(function(isNissanUser){
					for(let kit of listaKits){
						let dfdPedido;
						dfdPedido = that.generarPedidoPorOData(pedido, kit, isNissanUser);
	
						$.when(dfdPedido).then(function(mensaje){
							//TODO auditoria, todavia no poner en PRD
							let nroPedido = that.extraerNroPedido(mensaje);
							that.generarEntradaAuditoria(nroPedido);	
						});
						
						dfdsPedidos.push(dfdPedido);
					}
					
					$.when(...dfdsPedidos).then(function(){
						that.cerrarPopCarga();
						
						let mensajes = arguments;
						if(mensajes.length > 0){
							let mensaje = "";
							for(let i = 0; i < mensajes.length; i++)
								mensaje += mensajes[i] + "\n";
							
							MessageBox.information(mensaje, {
								onClose: that.navMenuPrincipal.bind(that)
							});
						}else{
							MessageBox.error("Hubo problemas para generar los pedidos, contacte a soporte.");
						}	
					});
					
				})
			}
		},
		generarPedidoPorOData: function(pedido, kit, usePP){
			let dfdPedido = $.Deferred();
			let token = this.getToken();
			
			this.getKitFormateado(pedido, kit).then(function(kitFormateado){
				let serviceParameters = {
					"Cliente": "",
					"Nav_Header_Pedido": kitFormateado
				};
				
				let urlCrearPedido = '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CREAR_PEDIDO_SRV';
					urlCrearPedido += usePP ? "" : ";o=AR_DP_ERP_OP_USER_COM";
					urlCrearPedido += "/HeaderSet";
                    var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
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
					success: function (dataR, textStatus, jqXHR) {
						let datosRespuesta = dataR.d.Nav_Header_Pedido.results.Mensaje !== undefined ? 
										dataR.d.Nav_Header_Pedido.results :
										dataR.d.Nav_Header_Pedido.results[0]
						
						let nroPedido = datosRespuesta.Mensaje.split(":")[1].trim();
						that.registrarDetalleKit(nroPedido, kit).then(function(result){
							let mensaje = datosRespuesta.Mensaje;
							mensaje += !result ? " Error al almacenar datos Cliente, Dominio y Comentario." : "";
							
							dfdPedido.resolve(mensaje);
						});
						
					},
					error: function (jqXHR, textStatus, errorThrown) {
						that.cerrarPopCarga();
		
						MessageBox.error("Error al crear el pedido, vuelva intentar. \n Si luego de varios intentos el error persiste, contacte a soporte..");
					}
				});
			});
			
			return dfdPedido;
		},
		getToken: function () {
			//Consulta
			let id = "";
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			$.ajax({
				type: 'GET',
				url: appModulePath + '/destinations/AR_DP_DEST_ODATA/odata/SAP/Z_NARG_DP_CREAR_PEDIDO_SRV',
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
		generarPedidoPorCPI: function(pedido, kit){
			let dfdPedido = $.Deferred();
			
			this.getKitFormateado(pedido, kit).then(function(kitFormateado){
				let serviceParameters = {
					"HeaderSet": {
						"Header": {
							"Nav_Header_Pedido": {
								"Pedido": kitFormateado
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
						let datosRespuesta = dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido.Mensaje !== undefined ? 
												dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido :
												dataR.HeaderSet.Header.Nav_Header_Pedido.Pedido[0]
						
						
						let nroPedido = datosRespuesta.Mensaje.split(":")[1].trim();
						that.registrarDetalleKit(nroPedido, kit).then(function(result){
							let mensaje = datosRespuesta.Mensaje;
							mensaje += !result ? ". Error al almacenar datos Cliente, Dominio y Comentario." : ".";
							
							dfdPedido.resolve(mensaje);
						});
					},
					error: function (jqXHR, textStatus, errorThrown) {
						that.cerrarPopCarga();
						
						MessageBox.error("Error al crear el pedido, vuelva intentar. \n Si luego de varios intentos el error persiste, contacte a soporte.");
					}
				});
			});
			
			return dfdPedido;
		},
		getKitFormateado: function(pedido, kit){
			let dfdKitFormateado = $.Deferred();
			Utils.loadCurrentUserData().then(function(datosUsuario){
				dfdKitFormateado.resolve([{
					"Cliente": pedido.Solicitante.Valor,
					"Dest": pedido.Destinatario.Valor,
					"PedWeb": pedido.PedidoDealer.Valor,
					"Tipo": "YNCK",
					"Material": kit.Kit,
					"CantPed": 1,
					"Vin": "",
					"OrdRep": "",
					"TipoMensaje": "",
					"Mensaje": "",
					"Usuario": datosUsuario.name
				}]);
			});
			
			return dfdKitFormateado;
		},
		registrarDetalleKit:function(nroPedido, kit){
			let dfdRegistrarDetalleKit = $.Deferred();
			
			this._oDataHanaModel.create("/DetalleKit", {
				ID_PEDIDO: nroPedido,
				ID_KIT: kit.Kit,
				CLIENTE: kit.Cliente,
				DOMINIO: kit.Dominio,
				COMENTARIO: kit.Comentario
			}, {
				success: function(){
					dfdRegistrarDetalleKit.resolve(true);
				},
				error: function(){
					dfdRegistrarDetalleKit.resolve(false);
				}
			});
			
			return dfdRegistrarDetalleKit;
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
					ID_ACCION: 3,
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
		extraerNroPedido: function(mensaje){
			return mensaje.split(":")[1].trim();
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
			oRouter.navTo("CrearPedidoKits");	
		},
		
		cancelarPedido: function(){
			this.registrarDemanda();
			this.navMenuPrincipal();
		},
		navMenuPrincipal: function(){
			this._localModel.setProperty("/", {})
			
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
					"ID_TIPOPEDIDO": "YNCK"
				};
				
				that._oDataHanaModel.create("/PedidoDemanda", data, {success: function (odata, oResponse) {
						that.registrarDetalleDeDemanda(odata.ID_PEDIDO, pedido.ListaKits.Valor);
					}
				});
			});
		},
		registrarDetalleDeDemanda: function (idPedidoDemanda, listaKits) {
			if(listaKits.length > 0){
				let batchOperations = {};
				for(let kit of listaKits){
					if(!batchOperations[kit.Kit]){
						batchOperations[kit.Kit] = {
							"ID_PEDIDO": parseInt(idPedidoDemanda, 10).toString(),
							"MATERIAL": kit.Kit.toString(),
							"CANTPED": 1,
							"TIPO_MENSAJE": "",
							"RECARGO": "0",
							"PRECIOVENTA": "0",
							"CANTASIG": "0",
							"DESCUENTO": "0",
							"PRECIO": "0"	
						};
					}else{
						batchOperations[kit.Kit].CANTPED++;
					}
				}
				
				for(let batchOperationData of Object.values(batchOperations)){
					batchOperationData.CANTPED = batchOperationData.CANTPED.toString();
					
					this._oDataHanaModel.create("/PedidoDemandaDetalle", batchOperationData);
				}
			}
		},
		
		handleDelete: function(oEvent){
			let contextPathAListaKitsRow = oEvent.getSource().getParent().getBindingContextPath();
			let indiceRowListaDeKits = contextPathAListaKitsRow.split("/")[4];
			
			let listaKits = this._localModel.getProperty("/Pedido/ListaKits/Valor");
			listaKits.splice(indiceRowListaDeKits, 1);
			
			this.procesarKitsVerificadosVisualizacion();
			this._localModel.refresh();
		},
		
		openBOMPopUp: function(oEvent){
			let sourceButton = oEvent.getSource(),
				oView = this.getView();
			
			let kitModelPath = sourceButton.getParent().getBindingContextPath() + "/Kit"
			let kit = this._localModel.getProperty(kitModelPath);
			
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
		},
		
		//KIT SELECTION LOGIC
		getKitsConPrioridad: function(requerimientosYStocks){
			//Obtener iteable que retorna los kits que tengo que tener en cuenta para el paso
			//Sea M donde se almacena la configuracion maxima encontrada,
			//m donde se almacena la norma del vector que fue solucion optima, n la cantidad de kits que se usaron para completar
			//Sea y = (y_1, ..., y_m) los stock de los diferentes m materiales 
			//Sea R = (x_i,..., x_i) con x_i = (x_i1, ..., x_im) la matriz de requerimientos para los kits (i) de los materiales (m)
			//itero sobre el iterable
				//si tamaño coleccion de kits que me retorna el iterable > n
					//y' = y
					//itero sobre la coleccion de kits que me retorna el iterable j := variblae de iteracion kits
						//y' = y' - x_j
						//si existe algun valor menor que cero en y' break break(paso al siguiente iterable)
					//si |y'| < m
						//m = |y'|
						//n = cantidad de kits de la solucion
						//M = coleccion solucion
			
			
			let requerimientosKits = requerimientosYStocks.requerimientos;
			let stocksMateriales = requerimientosYStocks.stock;
			
			let requerimientosSolucion = [];
			let errorSolucion = Infinity;
			
			let kitsIterator = this.getKitsIterator(requerimientosKits);
			let pasoIterator = kitsIterator.next();
			while(!pasoIterator.done){
				let arregloDeRequerimientos = pasoIterator.value;
				if(arregloDeRequerimientos.length >= requerimientosSolucion.length){
					let copiaStock = Object.assign({}, stocksMateriales);
					let stockInsuficiente = false;
					
					for(let i = 0; i < arregloDeRequerimientos.length; i++){
						let requerimiento = arregloDeRequerimientos[i];
						for(let idMaterial in requerimiento.materiales){
							copiaStock[idMaterial] -= requerimiento.materiales[idMaterial];
							stockInsuficiente = copiaStock[idMaterial] < 0;
							
							if(stockInsuficiente)
								break;
						}
						
						if(stockInsuficiente)
							break;
					}
					
					if(!stockInsuficiente){
						let errorNuevaSolucion = this.calcularNivelSolucion(copiaStock);
						if(errorNuevaSolucion < errorSolucion){
							requerimientosSolucion = arregloDeRequerimientos;
							errorSolucion = errorNuevaSolucion
						}
					}
				}
				
				pasoIterator = kitsIterator.next();
			}
			
			return requerimientosSolucion;
		},
		
		calcularNivelSolucion: function(solucion){
			let nivelSolucion = 0;
			for(let idMaterial in solucion){
				nivelSolucion += solucion[idMaterial] * solucion[idMaterial];
			}
			
			return Math.sqrt(nivelSolucion);
		},
		
		getKitsIterator: function(listaKits){
			return {
					listaKits: listaKits,
					controlKitsIterando: new Array(listaKits.length).fill(false),
				    next: function() {
				    	let i = this.listaKits.length - 1;
				    	while( i >= 0 && this.controlKitsIterando[i]){
				    		this.controlKitsIterando[i] = false;
				    		i--;
				    	}
				    	if (i >= 0)
        					this.controlKitsIterando[i] = true;
				    	
				    	let listaKitsIterando = [];
				        for(let j = 0; j < this.controlKitsIterando.length; j++){
				        	if(this.controlKitsIterando[j])
				        		listaKitsIterando.push(this.listaKits[j]);
				        }
				    	
				        return {
				        	value: listaKitsIterando,
				        	done: i == -1
				        };
				    },
				    [Symbol.iterator]: function() { return this; }
				};
		}
	});
});