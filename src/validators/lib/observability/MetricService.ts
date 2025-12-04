import { BreakerState, CodeError, Logger, LogMetadata, Metric } from "../config/types/env";

export class MetricService {
    constructor (private readonly logger: Logger){}

reportCircuitStateChange(
    fromState:BreakerState, 
    toState: BreakerState, 
    failureCount:number, 
    meta?: LogMetadata//una epxlicacion del por que se recibe de esta manera en los parametros
){
this.logMetric({
    name: "circuit_state:change", 
    type: "state_transition", 
    value: 1, 
    unit: "count", 
    tags: {
        from_state: fromState, 
        to_state: toState, 
        failure_count: failureCount
    }
}, meta)///porque se pone metric aqui ?
}
reportCircuitBlocked(state: BreakerState, meta?: LogMetadata){
this.logMetric({
    name: "circuit_blocked", 
    type: "circuit_state", 
    value: true, 
    unit: "boolean", 
    tags: {state}
}, meta)//el porque se envian los mensajes de esta froma ?
}

reportUploadError(errorCode: CodeError, durationMs: number, meta?: LogMetadata){
this.logMetric({
    name: "upload_error", 
    type: "error_rate", 
    value: errorCode, 
    unit: "error_code", 
    tags: {error: errorCode}, 
    timestamp: Date.now()//porque poner aqui la hroa y no en kas otras funciones  de  devolucion de mensajes

}, {
    ...meta, durationMs//porque y que esta devolviendo este resultado al final esos 2 valores y si es correcto
})
}


reportUploadSuccess(fileSize: number, durationMs: number, fileType: string, meta?: LogMetadata){
this.logMetric({
    name: "upload_success", 
    type: "buisiness", 
    value: 1, 
    unit: "count", 
    tags: {fileType}, 
    timestamp: Date.now()
}, {
    ...meta, 
    fileSize, 
    durationMs, 
    throughput: fileSize / (durationMs /1000)///porque todo el mensaje se configira  asi fiferente a todos los demas a demas de incluoir todos estos campós al final de la funcioon  
})
}

reportUploadPerfomance(durationMs: number, fileSize:number, meta?: LogMetadata){
this.logMetric({
    name: "upload_performance", 
    type: "performance", 
    value: durationMs, 
    unit: "ms", 
    timestamp: Date.now(), 
    tags: {
        fileSize: `${Math.round(fileSize / 1024 / 1024)}MB` //por que se envia el tags y en plos otrs no y porque se envia de esta manera ? 
    }
})
}
//porque todas las funciones no tinenn ni el private ni el public ? 
private logMetric(metric: Metric, meta?: LogMetadata){
this.logger.metric(metric, meta)
}

}