import { Logger, LogLevel, LogMetadata, Metric } from "@/lib/config/types/env";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";


//definir la intarefaz de logger
/* interface propsFunction{
    message: string;
    metadata?: Record<string, unknown>
} lo iba a utilizar pero no se meten objetos a laas funciones entonces esto no serviria pero que si y seria correctto? */

/* export interface Logger{
    info(message: string, meta?: Record<string, unknown>):void;//no se que tan correcto sea que envie void pero tal vez lo mejor seria tiparlo tambien y validarlo con zod para tener respustas determinadas en cada caso asi manejamos y gestionamos posibles resultados en vez de dejar algo al aire o no manejar errores/mensajes etc de manera normalizada
    error(message: string, meta: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
} */
//Implementacion concreta de winston 

//consfiguracion segura con tipos
const LOG_LEVELS: Record<LogLevel, number> = {
    fatal: 0, 
    error: 1, 
    warn: 2, 
    info: 3, 
    debug: 4
}
const LOG_COLORS: Record<LogLevel, string>= {
fatal: "red", 
error: "red", 
warn: "yellow", 
info: "green", 
debug: "blue"
}

winston.addColors(LOG_COLORS)//que es esta funcion que permite que espera y porque se utilzia de esta manera 

class WinstonLogger implements Logger{
    private logger: winston.Logger //que es esta propiedad que tare winston de esta libreria y esta propiedad que hace y porque se relaicona con esta parte como utilizarla correctamente y cuando ut8ilizarla y porque 
    constructor(){
        this.logger = winston.createLogger({
            //levels: "debug",
            levels: LOG_LEVELS,//PORQUE FUNCIONA UTILIZAR ESTA CONSTANTE Y DE QUE SE DIFRENCIA DE LA OTRA MANERA Y PORQUE O COMO AFECTA EL CAMBIO Y si es profesioanl  
            format: winston.format.combine(
                winston.format.timestamp(), 
                winston.format.json(),
                winston.format.errors({stack: true})
            ), 
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(), 
                        winston.format.printf(info=> this.formatConsoleLog(info))//por que esta linea es mejor que lanetrior forma de manejarlo
                        /* winston.format.simple() version anetrior */
                    )//que hace esta configuracion y de que se diferencia de ahcerlo con un console svacio sin configurar con el objetio y porque se utiliza este metodo de console dentro de transports 
                }), 
                new DailyRotateFile({
                    filename: "logs/app-%DATE%.log", 
                    datePattern: "YYY-MM-DD", 
                    maxSize: "20m", 
                    maxFiles: "14d", 
                    zippedArchive: true, 
                    extension: ".gz"
                })//porque se utiliza este  neuvo wintosn de que dse diferencia del otro metodo que se aplciaba? cual es el efecto y si es correctoutilizarlo aqui?
                //new winston.transports.File({filename: "logs/combined.log"})
            ]
        })
    }


//formateo profesional para consola 
private formatConsoleLog(info: winston.Logform.TransformableInfo): string{
const {timestamp, level, message, ...meta} = info;//que es exactamente lo que tare esta adata  y póruqe es pecificamente se tyipa asi el parametro y porque se maneja de esta manera ?
let log = `${timestamp} [${level}]: ${message}`//porque se hace esta linea de esta manera 

if(meta.metrics){
log += ` | Metrics: ${JSON.stringify(meta.metrics)}`    //+= que significa el simbolo 
}
if(meta.correlationId){
log += ` | CID: ${meta.correlationId}`
}
//quye son estoss datos que se estan valdiando y proque es asi y que devuelve qexacvtemente 
return log 
}


///Implemetnacion de  metricas profesionales  
metric(metric: Metric, meta: Omit<LogMetadata, "metrics"> = {}): void{
const metricMeta: LogMetadata = {
    ...meta, 
    metrics: [metric]//que sifginifica que se ponga este valor dentro de un array 
}
//Nivel info para metricas(podria ser debug en produccion)

this.logger.info(`METRIC: ${metric.name}`,metricMeta)//porque se envia asi y que  se  esta enviando y porque 
}


/* 
log(level: LogLevel, message: string, meta: LogMetadata = {}){//que son estas propeidades y esta funcion que esperra y x que se  tiliza con loger? es nativo de logger ? 
    this.logger.log(level, message, meta)
} porque esta funcion se elimino de la classe porqeu estaba y porque ahora se quito? */

info(message: string, meta: LogMetadata = {}): void { //se utilizo el objeto para inicializarlo como objeto vacio si no se le pasa ningun valor? 
    this.logger.info(message, meta);//como esto actua cuando se llama y como se relkacioana el logger con todas las dudas que puse en cosntructor 
}

error(message: string, meta:  LogMetadata = {}): void{
   this.logger.error(message, meta);
}

warn(message: string, meta?: LogMetadata): void{
this.logger.warn("warn", message, meta )
}

fatal(message: string, meta:  LogMetadata): void{
   this.logger.error(message, meta);//poque se agrego fatal 
}

debug(message: string, meta: LogMetadata): void{
    this.logger.debug(message, meta)//logger ya tiene por defecto estas funciuones de info error y debug? o porque o es posible acceder a estas propiedades de logger siendo que es una unsancia de winstons y si es asi entocnes  estas se utilizan hay algo mas que deba suber para saber manejar correctamente winstons ???y logger ???
}


}
//esportar instancia unica(Singleton)
export const logger: Logger = new WinstonLogger();//porque se hace de esta manera y el efecto de esto y como se relaicona con las clases y la cosntruccion del  post para crear ademas de razon de ser asi y si es lo correcto 
/* debug(message: string, meta: Record<string, unknown> = {}){
    this.logger.debug(message, meta)//logger ya tiene por defecto estas funciuones de info error y debug? o porque o es posible acceder a estas propiedades de logger siendo que es una unsancia de winstons y si es asi entocnes  estas se utilizan hay algo mas que deba suber para saber manejar correctamente winstons ???y logger ???
}
asi estab haciendo las  funciones iniciandolas con objeto vacio pero es mejor asi o como la tengo configuradas  */


