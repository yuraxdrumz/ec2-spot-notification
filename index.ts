import {IncomingMessage} from "http";
import {EventEmitter} from "events";
import Promise = require("bluebird");
import request = require("request");
import moment = require("moment");
import {format} from "url";
import Moment = moment.Moment;
import CoreOptions = request.CoreOptions;

export class SpotNotification extends EventEmitter {
    private beater: any;

    constructor() {
        super();

        this.beater = setInterval(() => {
            this.heartbeat();
        }, 5000);
    }

    static get requestOpts(): CoreOptions {
        return {
            baseUrl: format({
                protocol: "http",
                slashes: true,
                host: "169.254.169.254",
                pathname: "latest/meta-data"
            }),
            timeout: 2000,
        };
    }

    protected heartbeat(): void {
        this.checkStatus()
            .then((terminationTime: Moment) => {
                if (terminationTime.isValid() && terminationTime.isSameOrAfter(moment())) {
                    this.emit("termination", terminationTime);
                }
                else {
                    // Termination cancelled
                    this.emit("termination-cancelled", terminationTime);
                }
            })
            .catch((error: Error) => {
                // No termination process
                this.emit("termination-not-detected", error);
            });
    }

    protected checkStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            request.get("spot/termination-time", SpotNotification.requestOpts, (error: null|Error, response: IncomingMessage, body: string) => {
                if (!error && response.statusCode === 200) {
                    resolve(moment(body));
                }
                else {
                    reject(error);
                }
            });
        });
    }

    public instanceId(): Promise<any> {
        return new Promise((resolve, reject) => {
            request.get("instance-id", SpotNotification.requestOpts, (error: null|Error, response: IncomingMessage, body: string) => {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject(error);
                }
            });
        });
    }
}

export const SpotNotifier = new SpotNotification();
