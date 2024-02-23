sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/Device", "AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/model/models"], function (t, e, i) {
	"use strict";
	return t.extend("AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.Component", {
		metadata: {
			manifest: "json"
		},
		init: function () {
			t.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			this.setModel(i.createDeviceModel(), "device");

			let defaultModel = i.createDefaultModel();
			this.setModel(defaultModel);
			
			let ODataV2Model = i.createHanaModel();
			this.setModel(ODataV2Model, "ODataHana");
			
			
			if (this.getComponentData()){
				let nrosMateriales = this.getComponentData().startupParameters.nrosMateriales;
				let pedidoDealer =  decodeURIComponent(this.getComponentData().startupParameters.pedidoDealer);
				
				defaultModel.setProperty("/NrosMaterialesPedidoPrecargado", nrosMateriales ? nrosMateriales : []);
				defaultModel.setProperty("/PedidoDealerPrecargado", pedidoDealer ? pedidoDealer : "");
			}else{//Para testear en WEBIDE
				defaultModel.setProperty("/PedidoDealerPrecargado", "");
				defaultModel.setProperty("/NrosMaterialesPedidoPrecargado", []);
			}
		},
		getContentDensityClass: function () {
			if (!this._sContentDensityClass) {
				if (!sap.ui.Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact"
				} else {
					this._sContentDensityClass = "sapUiSizeCozy"
				}
			}
			return this._sContentDensityClass
		}
	})
});