"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var Promise = require("bluebird");
var request = require("request");
var moment = require("moment");
var url_1 = require("url");
var timers_1 = require("timers");
var SpotNotification = (function (_super) {
    __extends(SpotNotification, _super);
    function SpotNotification() {
        return _super.call(this) || this;
    }
    Object.defineProperty(SpotNotification, "requestOpts", {
        get: function () {
            return {
                baseUrl: url_1.format({
                    protocol: "http",
                    slashes: true,
                    host: "169.254.169.254",
                    pathname: "latest/meta-data"
                }),
                timeout: 2000,
            };
        },
        enumerable: true,
        configurable: true
    });
    SpotNotification.prototype.heartbeat = function () {
        var _this = this;
        var now = moment().add(1, "minute");
        this.checkStatus()
            .then(function (terminationTime) {
            if (terminationTime.isValid() && terminationTime.isSameOrAfter(now)) {
                // Termination scheduled
                _this.emit("termination", terminationTime);
            }
            else {
                // Termination cancelled
                _this.emit("termination-cancelled", terminationTime);
            }
        })
            .catch(function (error) {
            // No termination process
            _this.emit("termination-not-detected", error);
        });
    };
    SpotNotification.prototype.checkStatus = function () {
        return new Promise(function (resolve, reject) {
            request.get("spot/termination-time", SpotNotification.requestOpts, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    // TODO: check value is date string or not
                    resolve(moment(body));
                }
                else {
                    reject(error || response.statusCode);
                }
            });
        });
    };
    SpotNotification.prototype.instanceId = function () {
        return new Promise(function (resolve, reject) {
            request.get("instance-id", SpotNotification.requestOpts, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject(error || response.statusCode);
                }
            });
        });
    };
    SpotNotification.prototype.start = function () {
        var _this = this;
        this.beater = setInterval(function () {
            _this.heartbeat();
        }, 5000);
    };
    SpotNotification.prototype.stop = function () {
        if (this.beater) {
            timers_1.clearInterval(this.beater);
        }
    };
    return SpotNotification;
}(events_1.EventEmitter));
exports.SpotNotification = SpotNotification;
exports.SpotNotifier = new SpotNotification();
