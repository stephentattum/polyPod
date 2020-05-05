import {Consumer, Port, ReceivePort, SendPort} from "./port";

export interface PromiseResolvers<T> {
    resolve(t: T | Promise<T>): void;
    reject(err?: any): void;
}

export interface WithResolvers<Req, Res> {
    request: Req;
    responder: PromiseResolvers<Res>;
}

export type ResponsePort<Req, Res> = ReceivePort<WithResolvers<Req, Res>>;
export type RequestPort<Req, Res> = SendPort<WithResolvers<Req, Res>>;

export type Procedure<Req, Res> = (req: Req) => Promise<Res>;

export function client<Req, Res>(
    port: RequestPort<Req, Res>
): Procedure<Req, Res> {
    return req => new Promise<Res>((resolve, reject) => {
        port.send({
            request: req,
            responder: { resolve, reject }
        });
    });
}

export function server<Req, Res>(
    port: ResponsePort<Req, Res>,
    procedure: Procedure<Req, Res>
): void {
    port.addHandler(async request => {
        try {
            const response = await procedure(request.request);
            request.responder.resolve(response);
        }
        catch (err) {
            request.responder.reject(err);
        }
    });
}

export interface ClientRequest<T> {
    request: T;
    id: number;
}

export type ServerResponse<T> =
    { id: number; response: T } |
    { id: number; error: unknown }

export function liftClient<Req, Res>(
    port: Port<ServerResponse<Res>, ClientRequest<Req>>
): RequestPort<Req, Res> {
    let id = 0;
    const pending = new Map<number, PromiseResolvers<Res>>();
    port.addHandler(response => {
        const { resolve, reject } = pending.get(response.id)!;
        if ("error" in response)
            reject(response.error);
        else
            resolve(response.response);
    });

    return {
        send: req => {
            const currentId = ++id;
            pending.set(currentId, req.responder);
            port.send({
                request: req.request,
                id: currentId
            });
        }
    };
}

export function liftServer<Req, Res>(
    port: Port<ClientRequest<Req>, ServerResponse<Res>>
): ResponsePort<Req, Res> {
    let handler: Consumer<WithResolvers<Req, Res>> | undefined = undefined;

    port.addHandler(async request => {
        const h = handler;
        if (!h)
            return;

        try {
            const response = await new Promise<Res>((resolve, reject) => {
                h({
                    request: request.request,
                    responder: {resolve, reject}
                });
            });
            port.send({
                id: request.id,
                response
            });
        }
        catch (err) {
            port.send({
                id: request.id,
                error: err
            });
        }
    });

    return {
        addHandler: h => {
            if (!handler)
                handler = h;
        }
    };
}
