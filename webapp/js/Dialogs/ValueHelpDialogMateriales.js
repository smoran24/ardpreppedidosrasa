sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function (Fragment, Filter, FilterOperator, MessageBox) {
	"use strict";
	return {
		open: function(ownerView, materialesSonKits){
			var that = this;
			this.ownerView = ownerView;
			this.materialesSonKits = materialesSonKits;
			
			if (!this._valueHelpDialog || !this._valueHelpDialog.oPopup) {
				this._valueHelpDialog = Fragment.load({
					name: "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Dialogs.ValueHelpDialogMateriales",
					controller: this
				}).then(function (oValueHelpDialog) {
					ownerView.addDependent(oValueHelpDialog);
					that._valueHelpDialog = oValueHelpDialog;
					that._valueHelpDialog.open();
				});
			}else{
				this._valueHelpDialog.open();
			}
		},
		
		filtroMateriales: function(oEvent){
			let filterValue = oEvent.getParameter("value").toUpperCase();
			
			let filters = [];
			filters.push(new Filter('MATERIAL', FilterOperator.StartsWith, filterValue));
			
			oEvent.getParameter("itemsBinding").filter(filters);
		},
		
		onClose: function(oEvent){
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				if(this.materialesSonKits){
					this.ownerView.getModel().setProperty("/Pedido/ListaKits/ValorPorAgregar/Kit", oSelectedItem.getTitle());
				}else{
					this.ownerView.getModel().setProperty("/Pedido/ListaMateriales/ValorPorAgregar/Material", oSelectedItem.getTitle());
				}
			}
			oEvent.getSource().getBinding("items").filter([]);
		}
	}
});