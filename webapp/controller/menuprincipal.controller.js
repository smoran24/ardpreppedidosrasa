 sap.ui.define([
 	"sap/ui/core/mvc/Controller",
 	"sap/m/MessageToast",
 	"jquery.sap.global",
 	'sap/ui/core/Fragment',
 	'sap/ui/model/Filter',
 	"sap/m/Button",
 	"sap/m/Dialog",
 	"sap/m/Text"
 ], function (Controller, MessageToast, global, Fragment, Filter, jquery, Button, Dialog, Text) {
 	"use strict";
 	var t, oSAPuser, Stock = false,
 		inmovilizado = false,
 		interno = false,
 		urgente = false,
 		diferido = false,
 		kits = false,
 		anormal = false,
 		oView, codsucursal = false;
 	var block;
 	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.menuprincipal", {

 		onInit: function () {
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            var appModulePath = jQuery.sap.getModulePath(appid);
 			var oRouter =
 				sap.ui.core.UIComponent.getRouterFor(this);
 			t = this;
             
 			oView = this.getView();
 			$.ajax({
 				type: 'GET',
                 dataType:"json",
 				url:appModulePath + "/services/userapi/currentUser",
 				async: true,
 				success: function (dataR, textStatus, jqXHR) {
 					oSAPuser = dataR.name;
 					// oSAPuser = "P000253"; //1447
 					t.leerUsuario(oSAPuser);

 				},
 				error: function (jqXHR, textStatus, errorThrown) {

 				}
 			});
 			// t.leerUsuario(oSAPuser);
 			
 			let nrosMaterialesPedidoPrecargado = this.getOwnerComponent().getModel().getProperty("/NrosMaterialesPedidoPrecargado");
 			if(nrosMaterialesPedidoPrecargado && nrosMaterialesPedidoPrecargado.length > 0){
 				this.stock();
 			}
 			

 		},
 		bloqueo: function (bloqueo) {

 			if (bloqueo === true) {
 				oView.byId("interno").setVisible(false);
 			}
 		},
 		//funciones de logica
 		leerUsuario: function (oSAPuser) {
 			var url = '/destinations/IDP_Nissan/service/scim/Users/' + oSAPuser;
             var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
             var appModulePath = jQuery.sap.getModulePath(appid);
 			//Consulta
 			$.ajax({
 				type: 'GET',
 				url:appModulePath + url,
 				contentType: 'application/json; charset=utf-8',
 				dataType: 'json',
 				async: false,
 				success: function (dataR, textStatus, jqXHR) {
 					var grupos = dataR.groups;
 					
 					for (var i = 0; i < grupos.length; i++) {
 						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAINMOVILIZADO") {
 							inmovilizado = true;
 						}
 						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASASTOCK") {
 							Stock = true;

 						}
 						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAINTERNO") {
 							interno = true;
 						}
 						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAURGENTE") {
 							urgente = true;
 						}
 						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASADIFERIDO") {
 							diferido = true;
 						}
 						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAKITS") {
 							kits = true;
 						}
 						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAANORMAL") {
 							anormal = true;
 						}
 						if (dataR.groups[i].value === "AR_DP_ADMINISTRADORDEALER" || dataR.groups[i].value === "AR_DP_USUARIODEALER") {
 							codsucursal = true;
 						}
 					}

 					oView.byId("inmovilizado").setVisible(inmovilizado);
 					oView.byId("stock").setVisible(Stock);
 					oView.byId("interno").setVisible(interno && !codsucursal);
 					oView.byId("urgente").setVisible(urgente);
 					oView.byId("diferido").setVisible(diferido);
 					oView.byId("kits").setVisible(kits);
 					oView.byId("anormal").setVisible(anormal);
 					
 					/*if (inmovilizado) {
 						oView.byId("inmovilizado").setVisible(true);
 					} else {
 						oView.byId("inmovilizado").setVisible(false);
 					}
 					if (Stock) {
 						oView.byId("stock").setVisible(true);
 					} else {
 						oView.byId("stock").setVisible(false);
 					}
 					if (interno) {
 						oView.byId("interno").setVisible(true);
 					} else {
 						oView.byId("interno").setVisible(false);
 					}
 					if (urgente) {
 						oView.byId("urgente").setVisible(true);

 					} else {
 						oView.byId("urgente").setVisible(false);
 					}*/

 					if (codsucursal) {
 						oView.byId("interno").setVisible(false);
 					}

 				},
 				error: function (jqXHR, textStatus, errorThrown) {

 				}
 			});

 		},

 		//funciones de movimiento 
 		stock: function () {
 			var oRouter =
 				sap.ui.core.UIComponent.getRouterFor(this);
 			oRouter.navTo("stock");

 		},
 		Inmovilizado: function () {

 			var oRouter =
 				sap.ui.core.UIComponent.getRouterFor(this);
 			oRouter.navTo("inmovilizado");
 		},
 		Interno: function () {
 			var oRouter =
 				sap.ui.core.UIComponent.getRouterFor(this);
 			oRouter.navTo("interno");
 		},
 		Urgente: function () {
 			var oRouter =
 				sap.ui.core.UIComponent.getRouterFor(this);
 			oRouter.navTo("urgente");
 		},
 		Diferido: function(){
 			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
 			oRouter.navTo("CrearPedidoDiferido");
 		},
 		Kits: function(){
 			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
 			oRouter.navTo("CrearPedidoKits");
 		},
 		Anormal: function(){
 			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
 			oRouter.navTo("CrearPedidoAnormal");
 		},
 		onSalir: function () {
 			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
 			oCrossAppNavigator.toExternal({
 				target: {
 					shellHash: "#"
 				}
 			});
 		},
 	});
 });