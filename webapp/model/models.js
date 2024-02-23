sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/odata/v2/ODataModel"
], function (JSONModel, Device, ODataV2) {
	"use strict";

	return {

		createDeviceModel: function () {
			let oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		createHanaModel: function(){
           // var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
          	var appModulePath = jQuery.sap.getModulePath("AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA");
			let oModel = new ODataV2({"serviceUrl":appModulePath +  "/destinations/AR_DP_REP_DEST_HANA/ODATA_masterPedido.xsodata/"});
			oModel.setUseBatch(false);
			return oModel;
		},

		createDefaultModel: function(){
			let oModel = new JSONModel({});
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		}
	};
});