//Esto se dividira en 3 partes

import { time } from "console"
import { AppErrorInterface, CodeError, ErrorPriority } from "./types/env"
import { randomBytes } from "crypto"

export abstract class AppError extends Error{
abstract readonly code: CodeError //subclases deben implementar 
abstract readonly priority: ErrorPriority
readonly timestamp: number = Date.now()
    constructor(technicalMessage: string, public readonly userMessage: string){
super(technicalMessage)
this.name = this.constructor.name 
//aqui porque se deja el userMessage solo utilizando su valor en toJson ? ademas de todos los valos ccomo code o priority o al final aunque se  utilizen en la funcion de toJSON comose relacionan o como funcionan entonces? adenas de como todo se relacionaria con el codigo 
    }
    //metodo opciona para la serializacion 
    toJSON(){
        return {
code: this.code, 
technicalMessage: this.message, 
userMessage: this.userMessage, 
priority: this.priority, 
timestamp: this.timestamp
        }
    }
}

export class NetworkError extends AppError implements AppErrorInterface{
   //Propiedades requeridas por AppError
//aqui entiendo que estas 2 propiedades son las nuevas que se estan agregando a las existentes ademas de  que en el constructor quisiera entender que si bien declaras los campos adicionales como code o userMessage inexistentes en Error  como es que se agregan a nuevas propiedades a esta nueva clase, bastan con simplemente pedirlas por el cosntructor y para las propiedades que ncesiatan ser sobre escritas o inicializar unv  vlor definido se posicionan afuera del consturcor pero quisiera entender la razon de todo esto porque  de esta mnera y no de otra , no es  queja mas bien es que quiero entenderlo 



 public readonly id: string; 
 public readonly timestamp: number; 

 constructor (
    public readonly code: CodeError,
    public readonly technicalMessage: string, 
    public readonly userMessage: string, 
    public readonly priority: ErrorPriority, 
    public readonly isRetryable: boolean 
){
    super(technicalMessage, userMessage)//llama al cosntructor de Error 
this.name = "NetworkError"; //nombre de la clase 
this.id = `net-${randomBytes(16).toString("hex")}`//Id unico//que es lo que esta haciendo exactamente, porque de esta manera  y que proposito o como es util esta propiedad??
this.priority = priority
this.code = code
this.isRetryable = isRetryable
this.timestamp = Date.now()//Marca temporal//que fincion como es util y quebbtanto afecta esta propiedad 

 }


 //metodo opcional de serializacion 
 //entiendo que al ahcer el implements es como hcer un contrato con la clase pero tambien mie duda es porque se utiliza tambien enn eltoJSOJN si ya se implemento de que devovlera esta estructura ? quiiera que me dieras una explciacion a fondo y detallada para comprender esta situacion 

 toJSON(): AppErrorInterface{
return{
    id: this.id, 
    code: this.code, 
    technicalMessage: this.message, 
    userMessage: this.userMessage, 
    priority: this.priority, 
    timestamp: this.timestamp, 
    metadata: {
        isRetryable: this.isRetryable
    }
}
 }

 




}


export class ConfigError extends AppError implements AppErrorInterface{
    public readonly id: string //porque ponerlas como public y readolny??
    public readonly timestamp: number 
    constructor (
        public readonly technicalMessage: string,
        public readonly userMessage: string, 
        public readonly code: CodeError, 
        public readonly priority: ErrorPriority, 
        public readonly isRetryable: boolean
    ){
        super(technicalMessage, userMessage)//en que momento se crearon las propiedades priority etc siendo que en appError no se delcararon mas que aqui en constructor  como para ser posible utilziar this aqui
        this.name  = "ConfigError"
        this.id = `cnfg-${randomBytes(16).toString("hex")}` 
        this.priority  = priority
        this.code = code, 
        this.isRetryable = isRetryable
        this.timestamp = Date.now()
    }

///metodo opcional de serializacion 
toJSON(): AppErrorInterface{
return {
    id: this.id, 
    code: this.code, 
    technicalMessage: this.message, 
    userMessage: this.userMessage, 
    priority: this.priority, 
    timestamp: this.timestamp, 
    metadata: {
        isRetryable: this.isRetryable
    }
}
}


}


export class UploadError extends AppError implements AppErrorInterface{
    public readonly id: string 
    public readonly timestamp: number

    constructor(
        public readonly technicalMessage: string, 
        public readonly usserMessage:string, 
        public readonly code: CodeError,
        public readonly priority: ErrorPriority, 
        public readonly isRetryable: boolean,
        public readonly metadata: Partial<Record<string, unknown>>
    ){
        super(technicalMessage, usserMessage)
        this.name = "UploadError"
        this.id = `upld-${randomBytes(16).toString("hex")}`
        this.priority = priority
        this.code = code
        this.isRetryable = isRetryable
        this.metadata = metadata
        this.timestamp = Date.now()

    }

//metoodo de serializacion 
toJSON(): AppErrorInterface{
return{
    id: this.id, 
    code: this.code,
    technicalMessage: this.message, 
    userMessage: this.userMessage, 
    priority: this.priority, 
    timestamp: this.timestamp, 
    metadata: {
        isRetryable: this.isRetryable
    }
}
}

}




export class ValidationError extends AppError implements AppErrorInterface{
public readonly id: string;
public readonly timestamp: number

    constructor(
        public readonly technicalMessage: string, 
        public readonly userMessage: string,
        public readonly code: CodeError, 
        public readonly priority: ErrorPriority, 
        public readonly isRetryable: boolean, 
        public readonly metadata: Partial<Record<string, unknown>>
    ){
        super(technicalMessage, userMessage)
        this.id = `vldtn-${randomBytes(16).toString("hex")}`
        this.priority = priority
        this.code = code 
        this.isRetryable = isRetryable
        this.metadata = metadata
        this.timestamp = Date.now()
    }

//metodo opcional de serializacion 
toJSON(): AppErrorInterface{
    return{
id: this.id, 
code: this.code, 
technicalMessage: this.message, 
userMessage: this.userMessage, 
priority: this.priority, 
timestamp: this.timestamp, 
metadata: {
    isRetryable: this.isRetryable
}
    }
}


}




/* return{
    id: this.id, 
    code: this.code, 
    technicalMessage: this.message, 
    userMessage: this.userMessage, 
    priority: this.priority, 
    timestamp: this.timestamp, 
    metadata: {
        isRetryable: this.isRetryable
    }
} */
/* this.name = "NetworkError"; //nombre de la clase 
this.id = `net-${Date.now()}-${Math.random().toString(16).slice(2)}`//Id unico//que es lo que esta haciendo exactamente, porque de esta manera  y que proposito o como es util esta propiedad??
this.priority = priority
this.code = code
this.isRetryable = isRetryable
this.timestamp = Date.now()//Marca temporal//que fincion como es util y quebbtanto afecta esta propiedad 

 } */



