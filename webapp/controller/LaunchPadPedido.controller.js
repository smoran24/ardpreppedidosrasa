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
	var t, oSAPuser, Stock, inmovilizado, interno, urgente, oView;
	return Controller.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.controller.LaunchPadPedido", {
		onInit: function () {
	
			t = this;
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            var appModulePath = jQuery.sap.getModulePath(appid);
			oView = this.getView();
			$.ajax({
				type: 'GET',
                dataType:"json",
				url:appModulePath + "/services/userapi/currentUser",
				success: function (dataR, textStatus, jqXHR) {
				//	oSAPuser = dataR.name;
					 oSAPuser = "P001437";//1447
					t.leerUsuario(oSAPuser);
				},
				error: function (jqXHR, textStatus, errorThrown) {

				}
			});
			// t.leerUsuario(oSAPuser);

		},
		//funciones de logica

		leerUsuario: function (oSAPuser) {
            var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
            var appModulePath = jQuery.sap.getModulePath(appid);
			var url = appModulePath + '/destinations/IDP_Nissan/service/scim/Users/' + oSAPuser;
			console.log(url);
			//Consulta
			$.ajax({
				type: 'GET',
				url: url,
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				async: false,
				success: function (dataR, textStatus, jqXHR) {
					var grupos = dataR.groups;
					console.log(grupos);
					for (var i = 0; i < grupos.length; i++) {
						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASASTOCK") {
							Stock = "true";
							if (Stock === "true") {
								oView.byId("stock").setVisible(true);
										console.log("Stock si ");
							} else {
								oView.byId("stock").setVisible(false);
										console.log("Stock no ");
							}
						}

						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAINMOVILIZADO") {
							inmovilizado = "true";
							if (inmovilizado === "true") {
								oView.byId("inmovilizado").setVisible(true);
								console.log("inmovilizado si ");
							} else {
										console.log("inmovilizado no ");
							}
						}

						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAINTERNO") {
							interno = "true";
							if (interno === "true") {
								oView.byId("interno").setVisible(true);
									console.log("interno si ");
							} else {
								oView.byId("interno").setVisible(false);
									console.log("interno no ");
							}
						}

						if (grupos[i].value === "AR_DP_REP_PEDIDO_RASAURGENTE") {
							urgente = "true";
							if (urgente === "true") {
								oView.byId("urgente").setVisible(true);
									console.log("urgente si ");
							} else {
								oView.byId("urgente").setVisible(false);
									console.log("urgente no ");
							}
						}

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
		}
	});
});