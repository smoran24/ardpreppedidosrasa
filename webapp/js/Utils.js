sap.ui.define([
], function (Fragment, Filter, FilterOperator, MessageBox) {
	"use strict";
	return {
		dealerRasa: 233911,

		loadCurrentUserIASData: function(){
			let that = this;
			let dfdIASUserData = $.Deferred();
			//let currentUserIASData = that._localModel.getProperty("/CurrentUserIASData");
			
			if(this.currentUserIASData){
				dfdIASUserData.resolve(this.currentUserIASData);
			} else {
				let currentUser = this.loadCurrentUserData();
				
				currentUser.then(function(currentUserData){
					var appModulePath = jQuery.sap.getModulePath("AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA");
					$.ajax({
						type: 'GET',
						url: appModulePath + '/destinations/IDP_Nissan/service/scim/Users/' + currentUserData.name,
						contentType: 'application/json; charset=utf-8',
						dataType: 'json',
						async: false,
						success: function (data, textStatus, jqXHR) {
							that.currentUserIASData = data;
							dfdIASUserData.resolve(data);
						},
						error: function (jqXHR, textStatus, errorThrown) {
							dfdIASUserData.resolve();
						}
					});
				});
			}
			
			return dfdIASUserData;
		},
		
		loadCurrentUserData: function(){
			let that = this;
			let dfdCurrentUser = $.Deferred();

			if(this.currentUserData){
				dfdCurrentUser.resolve(this.currentUserData);
			}else{
                // var appid = this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".","/");
                var appModulePath = jQuery.sap.getModulePath("AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA");
				$.ajax({
					type: 'GET',
					url:appModulePath + "/services/userapi/currentUser",
					dataType: "json",
					success: function (data, textStatus, jqXHR) {
						that.currentUserData = data;
						dfdCurrentUser.resolve(data);
					},
					error: function (jqXHR, textStatus, errorThrown) {
						dfdCurrentUser.resolve(data);
					}
				});
			}
			
			return dfdCurrentUser;
		},
		
		isCurrentUserANissanUser: function(){
			let dfdIsNissanUser = $.Deferred();
			let dfdCurrentUserDataIAS = this.loadCurrentUserIASData();
			
			$.when(dfdCurrentUserDataIAS).then(function(currentUserDataIAS){
				let isDealerUser = currentUserDataIAS.groups ? currentUserDataIAS.groups.find(group => group.value == "AR_DP_USUARIODEALER" || group.value == "AR_DP_ADMINISTRADORDEALER") : false; //usuarios opuestos a Nissan user: AR_DP_USUARIODEALER y AR_DP_ADMINISTRADORDEALER
				
				dfdIsNissanUser.resolve(isDealerUser ? false : true);
			});
			
			return dfdIsNissanUser;
		},

		isCurrentUserRASAUser: function(){//esto va tambien
			var that = this;
			let dfdIsNissanUser = $.Deferred();
			let dfdCurrentUserDataIAS = this.loadCurrentUserIASData();
			
			$.when(dfdCurrentUserDataIAS).then(function(currentUserDataIAS){
				if (currentUserDataIAS["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"] === undefined) {
					var custom = [];
				} else {
					var custom = currentUserDataIAS["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes;
				}
				
					
				for (var x = 0; x < custom.length; x++) {
					if (custom[x].name === "customAttribute6") {
						dfdIsNissanUser.resolve(custom[x].value == that.dealerRasa);
					}
				}
				
				dfdIsNissanUser.resolve(false);
				
			});
			
			return dfdIsNissanUser;
		}
		
	}
});