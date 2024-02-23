/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"AR_DP_REP_PEDIDO_RASA/AR_DP_REP_PEDIDO_RASA/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});