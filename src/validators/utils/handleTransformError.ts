import { AppErrorInterface } from "@/lib/config/types/env"

import { handleZodError } from "./handleZodError"
import { ZodError } from "zod"
import { ConfigError, NetworkError, UploadError, ValidationError } from "@/lib/config/errors"
import { randomBytes } from "crypto"


export const handleTransformError = (err: unknown): AppErrorInterface | AppErrorInterface[] => {
///Aqui esta el errror lo voy a formar y devolver un resultado 
if(err instanceof Error){
    //aqui porque se valida uriError y porque se valdia luego el name si incluye el typeErrror y la razon detras de esto 
const typeTranform = err.name.includes("URIError")? "URI_ERROR": err.name.includes("TypeError")?"TYPE_ERROR" : "GENERIC_ERROR"
    return {
        id: `err-${randomBytes(16).toString("hex")}`, 
        code: typeTranform, 
        technicalMessage: err.message, 
        userMessage: "Error de tipo", 
        priority: "high", 
        timestamp: Date.now(), 
        metadata: {
            isRetryable: false 
        }
}
}

if(err instanceof ZodError){
return  handleZodError(err)

}

if(err instanceof NetworkError){
return {
id: err.id, 
code: err.code, 
technicalMessage: err.message, 
userMessage:err.userMessage, 
timestamp: err.timestamp, 
priority: err.priority, 
metadata: {
    isRetryable: true
}
}
}

if(err instanceof ConfigError){
    return{
        id: err.id, 
        code: err.code, 
        technicalMessage: err.message,
        userMessage: err.userMessage,
        timestamp: err.timestamp, 
        priority: err.priority, 
        metadata: {
            isRetryable: false
        } 
    }
}

if(err instanceof UploadError){
    return {
        id: err.id, 
        code: err.code, 
        technicalMessage: err.message, 
        userMessage: err.userMessage, 
        timestamp: err.timestamp, 
        priority: err.priority, 
        metadata:{
            isRetryable: false
        }
    }
}


if(err instanceof ValidationError){
return {
    id: err.id, 
    code: err.code, 
    technicalMessage: err.message, 
    userMessage: err.userMessage, 
    timestamp: err.timestamp, 
    priority: err.priority, 
    metadata: {
        isRetryable: false 
    }
}
}

if(err instanceof DOMException &&  err.name === "AbortCotroller"){
return {
    id: `abrt-${randomBytes(16).toString("hex")}`,
    code: "ABORT_ERROR", 
    technicalMessage: err.message, 
    userMessage: "Se aborto la ejecucion", 
    timestamp: Date.now(),
    priority: "high", 
    metadata: {
        isRetryable: false
    }
}
}

  return  {
id: `unk-${randomBytes(16).toString("hex")}`, 
code: "UNKNOWED_ERROR", 
technicalMessage: "ERROR_UKNOWED", 
userMessage: "Unknowed Error", 
priority: "medium", 
timestamp: Date.now(), 
metadata: {
isRetryable: false 
}
   }
  
}
