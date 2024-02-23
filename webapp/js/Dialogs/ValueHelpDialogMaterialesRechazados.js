sap.ui.define([
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	'AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/js/Utils'
], function (Fragment, Filter, FilterOperator, MessageBox, Utils) {
	"use strict";
	let that;
	
	return {
		open: function(ownerView){
			that = this;
			this.ownerView = ownerView;
			this._localModel = ownerView.getModel();
			if (!this._valueHelpDialog || !this._valueHelpDialog.oPopup) {
				this._valueHelpDialog = Fragment.load({
					name: "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Dialogs.ValueHelpDialogMaterialesRechazados",
					controller: this
				}).then(function (oValueHelpDialog) {
					that.ownerView.addDependent(oValueHelpDialog);
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
			filters.push(new Filter('Material', FilterOperator.StartsWith, filterValue));
			
			oEvent.getParameter("itemsBinding").filter(filters);
		},
		
		onClose: function(oEvent){
			let oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				this.openMailDialog(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},
		openMailDialog: function (material) {
			if(!this._mailDialog){
				this._mailDialog = Fragment.load({
					name: "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.Correo",
					controller: this
				}).then(function (oMailDialog) {
					that.ownerView.addDependent(oMailDialog);
					that._mailDialog = oMailDialog;
					that._mailDialog.open();
					
					sap.ui.getCore().byId("materialess").setValue(material);
				});
			}else{
				this._mailDialog.open();
				sap.ui.getCore().byId("materialess").setValue(material);
			}
		},
		cerrarEnvioCorreo: function(){
			sap.ui.getCore().byId("materialess").setValue();
			sap.ui.getCore().byId("Vin").setValue();
			sap.ui.getCore().byId("descrpcion").setValue();
			this._mailDialog.close();	
		},
		estructura: function () { //Funcion que inicia el proceso de enviado del mail desde el fragment Correo
			// attach handlers for validation errors
			/*sap.ui.getCore().getMessageManager().registerObject(this.ownerView.byId("materialess"), true);
			sap.ui.getCore().getMessageManager().registerObject(this.ownerView.byId("descrpcion"), true);
			sap.ui.getCore().getMessageManager().registerObject(this.ownerView.byId("Vin"), true);*/
			let material = sap.ui.getCore().byId("materialess").getValue();
			let descripcion = sap.ui.getCore().byId("descrpcion").getValue();
			let Vin = sap.ui.getCore().byId("Vin").getValue();
			if (material === "" || descripcion === "" || Vin === "") {
				MessageBox.alert("Los Campos Referencia, Descripción y Vin son obligatorios");
			} else {
				let dfdCurrentUserIASData = Utils.loadCurrentUserIASData();

				$.when(dfdCurrentUserIASData).then(function(currentUserIASData){
					let correo = currentUserIASData.emails[0].value;
					var mensaje =
						"<table><tr><td class= subhead >Solicitud -<b> creación de material en SAP</b><p></td></tr><p><tr><td class= h1> Soporte,  Desde el portal de Dealer Portal," +
						"se levanta un ticket para la creación de un nuevo material SAP, con las siguientes características :  <p><b>Código Material: " +
						material + "</b><p><b>Descripción : " + descripcion + "</b> <p><b>Numero Vin : " + Vin +
						"</b> <p> El solicitante de este requerimiento es el usuario:<b>" +
						currentUserIASData.id +
						"</b><p><b> Mail: " + correo + " </b><p>" +
						"Saludos <p> Dealer Portal Argentina </td> </tr> </table>";

					that.enviarMail(mensaje).then(function(result){
						if(result){
							that.removerMaterial(material);
							that.cerrarEnvioCorreo();
							that.closeBusy();
							
							MessageBox.success("Correo enviado correctamente.");
						}else{
							MessageBox.error("Ocurrieron errores al intentar enviar el correo.");
						}
					});
				});
			}
		},
		
		validaVIN: function () {
			var arr = [];
			if (sap.ui.getCore().byId("Vin").getValue().length < 17 || sap.ui.getCore().byId("Vin").getValue().length > 17) {
				
				MessageBox.alert("El campo VIN debe ser de 17 caracteres.");
				sap.ui.getCore().byId("Vin").setValue();
			}

		},
		enviarMail: function(mensaje){
			this.openBusy()
			
			let dfdMandarMail = $.Deferred();
			let parametros = {
				"root": {
					"strmailto": "repuestos.soporte@nissan.com.ar",
					"strmailcc": "",
					"strsubject": "Solicitud de Material",
					"strbody": mensaje
				}
			};
			let parametrosAsString = JSON.stringify(parametros);
			var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
  var appModulePath = jQuery.sap.getModulePath(appid);
			$.ajax({
				type: 'POST',
				url: appModulePath + '/destinations/AR_DP_DEST_CPI/http/AR/DealerPortal/Mail',
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				data: parametrosAsString,
				success: function (dataR, textStatus, jqXHR) {
					dfdMandarMail.resolve(true);
					that.closeBusy();
				},
				error: function (jqXHR, textStatus, errorThrown) {
					if(jqXHR.status != 200){
						dfdMandarMail.resolve(false);
					}else{
						dfdMandarMail.resolve(true);
					}
					that.closeBusy();
				}
			});
			
			return dfdMandarMail;
		},
		
		removerMaterial: function(material){
			let materialesRechazados = this._localModel.getProperty("/Pedido/ListaMateriales/ListaMaterialesSeleccionadosNoExistentes");
			
			for(let i = 0; i < materialesRechazados.length; i++){
				if(materialesRechazados[i].Material == material){
					materialesRechazados.splice(i, 1);
					break;
				}
			}
			
			this._localModel.refresh();
		},
		openBusy: function () {
			// create dialog lazily
			if (!this._busyIndicator) {
				// create dialog via fragment factory
				this._busyIndicator = sap.ui.xmlfragment(this.ownerView.getId(), "AR_DP_REP_PEDIDO_RASA.AR_DP_REP_PEDIDO_RASA.view.PopUp", this);
				this.ownerView.addDependent(this._busyIndicator);
			}
			this._busyIndicator.open();
		},
		closeBusy: function () {
			this._busyIndicator.close();
		}
	}
});