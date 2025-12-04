import { AppError } from "@/types/searchClasses"
import { AppErrorInterface } from "@/types/searchTypes"
import { ZodError } from "zod"



export const normalizeError = (rawError: unknown): AppErrorInterface => {
  console.log(rawError)
  //si ya es un AppError, lo  retorna directamnete 
  if(rawError instanceof AppError){//es esta la manera de llar los campos en una lclase abstracta y  ademas de esto como seria la  utilizacion /implementacion corerecta de esto 
    return {...rawError, id: `val-${Date.now()}-${Math.random().toString(16).slice(2)}` , technicalMessage: rawError.message}
  }

//Manejo de errores Zod(Validacion)
if(rawError instanceof ZodError){
    return{
        id: `zod-${Date.now()}`, 
        code: "VALIDATION_ERROR", 
        technicalMessage: "Validation failed", 
        userMessage: "Porfavor corrige los errores en el formulario", 
        priority: "medium", 
        timestamp: Date.now(), 
        metadata: {//como es posible que me permita construir la metadata de esta manera y como afecta esto 
            issues: rawError.issues.map((issue)=>({
                path: issue.path, 
                message: issue.message
            }))
        }
    }
}
//errores de red (TypeError nativo)
if(rawError instanceof TypeError && rawError.message.includes("fetch")){//porque necesariamente incluir fetch y en que te basas para hacer esta validacion y entocenes los errores  de  tipo no se4ran capturados por este ? 
    return {
        id: `net-${Date.now()}`, 
        code: "NETWORK_ERROR", 
        technicalMessage: rawError.message, 
        userMessage: "Error de conexion. Verifica tu internet", 
        priority: "high", 
        timestamp: Date.now(), 
        metadata: {
            isRetryable: true //por que utilziar esta porpoiedad aqui y que tanto efecto tendria y como afectaria el incluirla 
        }
    }
}

//errores nativos genericos 
if(rawError instanceof Error){
    return {
        id: `err-${Date.now()}`, 
        code: "UKNOWN_ERROR", 
        technicalMessage: rawError.message, 
        userMessage: "Ocurrio un error inesperado", 
        priority: "critical", 
        timestamp: Date.now(), 
        metadata: {
            stack: rawError.stack //que es la propiedad stakc que funcion cumple como afecta esto y si esta estrcutura de metadada relacionada  al obejto de clave string y valor uknown que tanto afecta utilizas r o utilizar un valor en metadata 
        }
    }
}




  //fallback para errores completamnete ddesconocidos 
    return ({
   id: `unk-${Date.now()}`, 
   code: "UKNOWN_ERROR", 
   technicalMessage: "Unknown error ocurred", 
   userMessage: "Error desconocido", 
   priority: "critical", 
   timestamp: Date.now()
   
})

}
