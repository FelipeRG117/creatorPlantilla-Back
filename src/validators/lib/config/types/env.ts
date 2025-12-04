//////////////ESTARA DIVIDIDDO EN 3 PARTES 
import { z } from "zod";
import { CloudinarySchema } from "../schemas/schemas";
import { Readable } from "node:stream";
import { UploadApiResponse } from "cloudinary";
////tipo inferido del eschema de zod de cloudinary
export type CloudinaryConfig = z.infer<typeof CloudinarySchema>

//LOGS 
export type LogLevel = "fatal" |"error"|"warn"|"info"|"debug"
/* export type LogMetadata = Record<string, unknown> & {
  correlationId?: string; 
  userId?: string //estos 2 campos pq se utilizan 
} *///porque realziar los logs de esta maneta y que es lo que esta esperando entocnes 2 obejtos?? y de que manera?

export type MetricUnnit = 
| "ms"
| "count"
| "MB"
| "boolean"
|"percent"
| "error_code"
| "string"

//Tipos para metricas profesionales 
export type MetricType = 
|"performance"
|"buisiness"
|"error_rate"
|"throughput"
|"circuit_state"
| "state_transition" ;

export type MetricValue = number |string|boolean| object

export interface Metric {
  name: string; 
  value: MetricValue; 
  type: MetricType;
  unit?: string;
  timestamp?: number;
  tags?: Record<string, string | number>;

}

export type LogMetadata = Record<string, unknown> & {
  correlationId?: string;
  userId?: string;
  metrics?: Metric[];//para incluir multiples metricas 
}

export interface Logger {
  info(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
  fatal(message: string, meta?:  LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  metric(metric: Metric, meta?: Omit<LogMetadata, "metrics">): void //nuva firma profesional pero por`que es firma profesional? cpomo se rellaciona con el funcionamiento de logger?

}




//definir tipos para reader to secrets ......<>]]]]]]]]]]]]]]]]]+++++
export type SensitiveKeys = "apiKey" |"apiSecret"|"accessToken" |"encryptionKey"|"databasePassword"

export  type Redactable<T> =  T & Partial<Record<SensitiveKeys, string |null| undefined >>;//que quiere decir esto esta tomando el tipo genreico de donde?

//que quere decir este tipado y porque de esta manera y como es utl ventajas y desventajas de utilizarlo o no 
/* export type Redacted<T>={
  [K in keyof T]: K extends SensitiveKeys? `***${string}`: T[K] extends object? Redacted<T[K]> : T[K]; 
} *///que significa utilizar Redacted<T[K]> : T[K]; que devulevce cada caso porque se esta manera y las vetajas o desventajas de utilziarlo de esta manera y si es lo correcto ademas de que como se ocmpleemta con al funcion y el tipado 




export type CodeError = "SERVER_ERROR"  | "SEARCH_ERROR" | "ABORT_ERROR" | "GENERIC_ERROR" | "TYPE_ERROR" | "URI_ERROR" | "UNKNOWED_ERROR" |"ZOD_ERROR"|"NETWORK_ERROR"|"CONFIG_ERROR"| "UPLOAD_ERROR" |"VALIDATION_ERROR"| "STREAM_ERROR" | "TIMEOUT_ERROR" | "CIRCUIT_BREAKER_ERROR" | "SERVER_ERROR" | "UPLOAD_ERROR"


//estpo se  dividira en 3 partes 
//prioridad de errores 
export type ErrorPriority = "low"| "medium" |"high"|"critical"

//interfaz bbase (contrato que  debn cumplir todos los errores)
export interface AppErrorInterface{
    id: string; //identificador unico para  tracking 
    code: CodeError; //codigo maquina (ej NETWWORK_ERROR)
    technicalMessage: string;//mensaje tecnico para logs//com se relaciona con los  logs? y que tan util es 
    userMessage: string; //mensaje que sera leido por el usuario 
    priority: ErrorPriority;//nivel de urgencia 
    timestamp: number//Unix timestamp para sanalisis temporales/// //Quiesiera comprender mejor y a mas a grandes rasgos como estyo afecta ? como es util ? y porque necsariamente number mas que nada para eneteneder motivos y racionalidad
    metadata?: Record<string, unknown>//datos adicionales estructurados //entiendo que es para objetos con keys de string y valor uknown y que es opçional pero siendo ese el caso porque de esta manera? como afecta? y como es util la utilizacion de esto? y es lo correcto 

}


export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number; 
  size: number
}





///////redact secrets 
//1-
export type RedactedSpecial  = "[MAX_DEPTH]" | "[CIRCULAR]"
export type  RedactedValue<T> = T extends object ? Redacted<T> | RedactedSpecial : T //como funciona este tipado de condicional 
 
//2-


export type Redacted<T> = {
  [K in keyof T]: K extends "password" | "token"|"apiKey" ? "***": RedactedValue<T[K]>
} 

/////////////////////////////////


export type NodeReadableStream = Readable;
export type WebRedeableStream = ReadableStream<Uint8Array>
export interface StreamConverter {
  convert(webStream: WebRedeableStream): NodeReadableStream;
}
export interface ValidStream {
  getReader(): {
    read(): Promise<{done: boolean; value?: Uint8Array}>//porque se hace de esta manera sin comas ? 
    releaseLock( ): void;
  };
  locked: boolean
}//porque se hace de esta manera y como es posible y estrictruras soimilares 



/////
export type SensitiveKeyPattern =  "key"|"token"|"secret"|"password"|"auth"; 

 export type EagerTransformation = {
  url?: string;
  secure_url?: string; 
  //explicacion prohibir campos sensibles 
 /*  api_key?:never; 
  signature?: never;  estos tipos los iba a ocupar inicialmente */
  [key: string]: unknown//porque se utiliza el array para marcar una key o lo que deberia se una key ademas de que cuando se aplcian estos campos y si hay mas formas similares de marcar lo de esta manera y si es buena practica
}
//actualizar el tipo extendido
//como es  que fucniona este tipado y como es que esta coformado teniendo en cuenta que tiene el and ademas de que cuando y de  quefroma se puede aplciar de manera que cumpla las  buenas practicas y se aplique correctamente y utilizarlo correctameente en los lugares  necesarios  
export type ExtendedUploadApiResponse = UploadApiResponse & {
  api_key: string; 
  signature?: string; 
  eager?: EagerTransformation[]
}
/////CIRCUITBREAKER 
export type BreakerState = "CLOSED" |"OPEN"|"HALF_OPEN"

