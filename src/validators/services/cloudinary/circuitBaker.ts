import { UploadError } from "@/lib/config/errors";
import { BreakerState, Logger } from "@/lib/config/types/env";
import { MetricService } from "@/lib/observability/MetricService";

export class CircuitBreaker {
    private state: BreakerState = "CLOSED";
    private failureCount = 0;
    private lastFailureTime  = 0;
    private halfOpenAttempts = 0

    private readonly resetTimeout: number;
    private readonly failureThreshold: number; 
    private readonly halfOpenMaxAttempts: number;
    private readonly logger: Logger;//porque se agregaron estps ultimos campos con readolny y porque es diferente y mejro a manetener el construcotr vacio y solo utilizar estas mismas propiedades pero en los parametros del constructor 
    constructor (
        logger: Logger,
        private readonly metrics: MetricService,//Inyeccion 
        failureThreshold: number = 5, 
        resetTimeout: number = 30000, 
        halfOpenMaxAttemps: number = 2
    ){
        this.logger = logger, 
        this.failureThreshold = failureThreshold, 
        this.resetTimeout = resetTimeout, 
        this.halfOpenMaxAttempts = halfOpenMaxAttemps
    }

    async execute <T>(fn: ()=> Promise<T> ): Promise<T>{
        if(this.state === "OPEN"){
            if(this.canAttemptHalfOpen()){//porque aqui se valuida este valor exactamente  aqui?
              this.transitionState("HALF_OPEN")//porque se  retrona este valor y se llama esta funcion despues de  validar la funcion de arriba   
            }else {
                this.metrics.reportCircuitBlocked("OPEN");
                throw new UploadError(
                    "SERVICE_UNAVAILABLE", 
                    "Service is temporarily unavailable", 
                    "CIRCUIT_BREAKER_ERROR", 
                    "high", 
                    true, 
                    {}
                )//por que se realizan estas acciones en el else? 

            }
        }
        try {
            const result = await fn()
            this.recordSucces() //que es el signo de  gato  y ademas de que que  es lo que ace esta linea y porque es difrerenete a un tis normal ? y como afecta al codigo  
            return result 
        } catch (error) {
            this.recordFailure()
            throw error; 
            //igual mi duda es de como efcta de igual manera la linea con el gato al codigo de error y si es correcto que se muestre un throw en el casio de error 
        }
    }


private canAttemptHalfOpen(): boolean{
 return Date.now() - this.lastFailureTime > this.resetTimeout//una explciacion del porque se hacen estos singles functions y porque se hace esta operacion a diferencia de la de antes 

}

private transitionState(newState: BreakerState): void{
const previousState = this.state;
this.state = newState
 this.metrics.reportCircuitStateChange(
    previousState, 
    newState, 
    this.failureCount//porqque se evnia de esta forma y que exactamente esta entregandoy recibiendo 
 );
}

private recordSucces(): void{
this.failureCount = 0//porque se inicaliza en 0' 
if(this.state === "HALF_OPEN"){
    this.halfOpenAttempts++;//porque se hace una suma de 1 ? 
    if(this.halfOpenAttempts >= this.halfOpenMaxAttempts){
        this.transitionState("CLOSED")//por que se envia y se hace esta funcion de esta manera yb porque si es escalabale 
    }
}
}

private recordFailure(): BreakerState{
return this.state; //quisiera comprender por que solo se retrona este valor y como se relaicona conlas demas funciones y su porpostio yb por que es escalable 

}

public getState():BreakerState{
return this.state//porque este metodo es el unico publico y porque solo retrona state y que devielve exqctmente 
}

}

















/* async execute <T>(fn: ()=> Promise<T> ): Promise<T>{
        if(this.state === "OPEN"){
            if(Date.now() - this.lastFailureTime > this.resetTimeout){
                this.state = "HALF_OPEN"
                this.logger.info("CircuitBreaker: Transitioning to HALF_OPEN state")
            }else{
                this.logger.metric("circuit_blocked", {state: "OPEN"})
                throw new UploadError(
                    "SERVICE_UNAVAILABLE", 
                    "Service is temporarily unavailable", 
                    "CIRCUIT_BREAKER_ERROR", 
                    "high", 
                    true, 
                    {}
                )
            }
        }
        try {
            const result = await fn()
            this.#recordSucces();//que es el signo de  gato  y ademas de que que  es lo que ace esta linea y porque es difrerenete a un tis normal ? y como afecta al codigo  
            return result 
        } catch (error) {
            this.#recordFailure
            throw error; 
            //igual mi duda es de como efcta de igual manera la linea con el gato al codigo de error y si es correcto que se muestre un throw en el casio de error 
        }
    }

#recordSucces(){
    if(this.state === "HALF_OPEN"){
this.failureCount = 0
if(++this.halfOpenAttempts  >= this.halfOpenMaxAttempts){
    this.state = "CLOSED"
} 
    }
}




    #recordFailure(){
        this.failureCount ++;
        if(
            this.failureCount >= this.failureThreshold || 
            this.state === "HALF_OPEN"
        ){
            this.state = "OPEN"; 
            this.lastFailureTime = Date.now()
        }
    }
}
     */