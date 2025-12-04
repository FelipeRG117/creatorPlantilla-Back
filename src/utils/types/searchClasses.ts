import { AppErrorInterface, ErrorPriority } from "./searchTypes";


export abstract class AppError extends Error{
abstract readonly code: string//sublcases deben implementar 
abstract readonly priority: ErrorPriority;
readonly timestamp: number = Date.now()

    constructor(technicalMessage: string,public readonly userMessage: string){
        super(technicalMessage);
        this.name = this.constructor.name
    }

    //metodo opcional para serializacion 
    toJSON(){
        return {
            code: this.code, 
            technicalMessage: this.message, //aqui me surge curiosidad porque userMessage la propiedd adicional en el esta clase hiaj que exiteinde de error le pasa esta propiedad como message a error, siendo ese elc aso entonces los 2 tienen el mismo valor? y x hacaer esto si los 2 tienen el mismo valor?
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


    constructor(
        public readonly code: string, //    Ej: NETWORK_500
        public readonly technicalMessage: string, // Mensaje tecnico
        public readonly userMessage: string,//Para  mostrar al usuario 
        public readonly priority: ErrorPriority,
        public readonly isRetryable: boolean//Propiedad especifica dde  NetworkError/pero porque es especifica en networkErro  y como afecta esto y es util 
    ){
        super(technicalMessage, userMessage)//Llama al cosntrucor de Error
        this.name = "NetworkError";//Establece el nombre de la clase
        this.id = `net-${Date.now()}-${Math.random().toString(16).slice(2)}`//Id Unico //que es lo que esta haciendo exactamente, porque de esta manera  y que proposito o como es util esta propiedad??
        this.priority = priority
        this.code = code
        this.isRetryable = isRetryable
        this.timestamp = Date.now()//Marca Temporal//que fincion como es util y quebbtanto afecta esta propiedad 
    }

    //Metodo opcional para serializacion
    
    //entiendo que al ahcer el implements es como hcer un contrato con la clase pero tambien mie duda es porque se utiliza tambien enn eltoJSOJN si ya se implemento de que devovlera esta estructura ? quiiera que me dieras una explciacion a fondo y detallada para comprender esta situacion 

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