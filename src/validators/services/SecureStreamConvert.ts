import { UploadError } from "@/lib/config/errors";
import { NodeReadableStream, StreamConverter, ValidStream, WebRedeableStream } from "@/lib/config/types/env";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { unknown } from "zod/v4";
//no habia viosto el import type directamente me puedes explciar cuando utilizar esto y hacerlo de esta manera y cuando es correcto o incorrecto utilizarlo y porque se utiliza de esta manera aqui 

export class SecureStreamConverter implements StreamConverter {
    constructor(private readonly timeoutMs: number = 30_000){}
    convert(webStream: WebRedeableStream): NodeReadableStream{
try {
//Validacion basica previa 
if(!webStream || typeof webStream.getReader !=="function"){//webStream que contiene exactamente y coo es posible hacer esta valdiacion?
throw new Error("Invalid web stream structure")
}


    return this.createTimedStream(webStream)
} catch (error) {
    throw new UploadError(
        "STREAM_CONVERSION_FAILED", 
        "Failed to convert Web Stream to Node Stream", 
        "STREAM_ERROR", 
        "high", 
        true, 
        {timeout: this.timeoutMs}
    )
}
    }

private validateStreamStructure(stream: unknown): asserts stream is ValidStream{
    if(typeof stream !== "object" || stream === null){
        throw new UploadError("Stream deberia ser un objeto no nulo", "Valor invalido", "VALIDATION_ERROR", "critical", false,{}
        )
    }

//validacion estructural 
const validStream  = stream as Partial<ValidStream>
const hasLocked = typeof validStream.locked === "boolean"
const hasGetReader = typeof validStream.getReader!() === "function"
const hasRead = hasGetReader && typeof validStream.getReader!().read === "function"
const hasReleaseLock = hasGetReader && typeof validStream.getReader!().releaseLock === "function"
//POQUE NO CAUSO ERL ERROR AL PONER EL PAERNTESIS AL LADO IZQUIERDO Y PORQUE IFNIERE QUE NO ES UNDEFINED CUANDO ESTAAS VALDIACIOMNES PR LO REGULAR EMPIEZAN DE al lado derecho del valor a comparar en vez de al lado izzquierdo del parentesis 

if(!(hasLocked && hasGetReader && hasRead && hasReleaseLock)){
throw new UploadError("Stream perdido en funciones requeridas", "Dato invalido", "CONFIG_ERROR", "critical", false, {}

)
}

   /*  const validStream = stream as ValidStream
    //verificacion estructuiral completa 
    const isValid = ( 
        typeof validStream === "function" && 
        typeof validStream.locked === "boolean" &&
        typeof validStream.getReader().read === "function" && 
        typeof validStream.getReader().releaseLock === "function"
    )//porque se hacen todas estas validaciones dde onde provienen y cuales son sus efectosy cual es su valor al inicar su valor por una valdiacin entre parentresis 
 
    if(!isValid){
throw new UploadError("Stream perdido en funciones requeridas", "Dato invalido", "CONFIG_ERROR", "critical", false, {}

)
    } */
}


private createTimedStream (webStream: WebRedeableStream): NodeReadableStream{
//Conversion seguura de tipos 
const nodeCompatibleStream = webStream as unknown as NodeWebReadableStream//porque se hace de esta manera ademas de que que quiere decir esxatctamente esta linea 


//1 conversion nativa eficiente (Node.js 17+)
    const nodeStream = Readable.fromWeb( nodeCompatibleStream, {
        highWaterMark: 1024 *1024, //1MB(optimizado para grandes archivos)
        objectMode: false
    });
    //verificacion profesional del resultado //porque es considerado validacion profesional?
    if(!(nodeStream instanceof Readable)){//´pporque el if se hace de esta manera con parametros y el signo de "! diferenete a " afuera de los parametros pero dentro de los ´paramretros del if que funcion cumple y caundo hacer una estructura similar ?
        throw new TypeError("Converted obvject is no a Readable stream")
    }
//timeout robusto 
    //2timeout profesional con destruccion controlada 
    let timeoutId: NodeJS.Timeout;//que tiene esta propiedad y de donde proviene y cuando es utili utilizar esta ropiedad ?

    const startTimeout =()=>{
timeoutId = setTimeout(()=> {
         if(!nodeStream.destroyed){
        const error = new UploadError(
            `Stream timeout after ${this.timeoutMs}ms`, 
            "UPLOAD_TIMEOUT", 
            "TIMEOUT_ERROR", 
            "high", 
            true, 
            {}
        );
        nodeStream.destroy(error)//poruqe ahora se hace de esta maneta y porque es mejor que la anetrior ?
     }
}, this.timeoutMs);
    };

    //3Mecanismo de reset de timeout con eventos 
    nodeStream.on("data", ()=>{
        clearTimeout(timeoutId);//a que se debe esta linea
        startTimeout();
    });
    //4 Limpieza garantizada
    const clearTimer =() => clearTimeout(timeoutId); 
    nodeStream.on("end", () => clearTimer)
    nodeStream.on("error", clearTimer)//porque aqui se aplcian 2 timneout y como se relaciona con el codigo 
    nodeStream.on("close", clearTimer)//porque se agrego esta lnea a la limpieza y el motivo de crear la constante de clearTimer  y utilizarla en estas linea de la funcion on de nodeStream 
    startTimeout();
    return nodeStream//una epxlcuacion de la utilidad y funcionamiento de las 2 ultimas 2 lineas y  relacion con el codigo 



}




}




/* 

private createTimedStream (webStream: WebRedeableStream): NodeReadableStream{

    const source = Readable.fromWeb(webStream as unknown as import("stream/web").ReadableStream<any>);
    let isTimedOut = false 

    const timeout = setTimeout(()=>{
        isTimedOut = true 
source.destroy ( new UploadError(
    `Stream operation timed out after ${this.timeoutMs}ms`,
    "Valor invalido", 
    "UPLOAD_ERROR", 
    "critical", 
    false,
    {}
))
    }, this.timeoutMs)//porque  se utiliza el this aqui y explica razones

return new Readable({
    highWaterMark: 1024 *64,//64KB buffer peor porque es kb y buffer????
    objectMode: false, 
    read(){//como es que existen estas funciones pre echas y de donde provienenen 
        source.read().then((chunk: Buffer | null)=>{
            if(isTimedOut) return ;
            clearTimeout(timeout)
            if(chunk=== null){
                this.push(null)
            }else{
                this.push(chunk)
            }//porque se hacen estas validaciones ademas del porque se esta realizando y efectos y consecuencias 
        }).catch((error: unknown) =>{
            clearTimeout(timeout);
            this.destroy(error as Error)
        })
    }, destroy(error: Error | null , callback: (error?: Error | null)=> void){
        clearTimeout(timeout);
    /*     source.destroy(error);
        callback(error) */
/*         this.destroy(error === null? undefined : (error as Error) )
    }
})



}
 */ 

/* 

private createTimedStream (webStream: WebRedeableStream): NodeReadableStream{
//Conversion seguura de tipos 
const nodeCompatibleStream = webStream as unknown as NodeWebReadableStream//porque se hace de esta manera ademas de que que quiere decir esxatctamente esta linea 


//1 conversion nativa eficiente (Node.js 17+)
    const nodeStream = Readable.fromWeb( webStream as any, {
        highWaterMark: 1024 *1024, //1MB(optimizado para grandes archivos)
        objectMode: false
    });

    //2timeout profesional con destruccion controlada 
    let timeoutId: NodeJS.Timeout;//que tiene esta propiedad y de donde proviene y cuando es utili utilizar esta ropiedad ?

    const startTimeout =()=>{
        timeoutId = setTimeout(() => {
            if(!nodeStream.destroyed){//de donde provienen todas esatas propiedades provenientes de node Stream ademas de que como es que  es util ademas de donde proviene todo y cuando es uttil utilziarlo
nodeStream.destroy(new UploadError(
    `Stream timeout after ${this,this.timeoutMs}ms`, 
    "UPLOAD_TIMEOUT", 
    "TIMEOUT_ERROR", 
    "high", 
    true, 
    {}
))
            }
        }, this.timeoutMs)
    };

    //3Mecanismo de reset de timeout con eventos 
    nodeStream.on("data", ()=>{
        clearTimeout(timeoutId);//a que se debe esta linea
        startTimeout();
    });
    //4 Limpieza garantizada 
    nodeStream.on("end", () => clearTimeout(timeoutId))
    nodeStream.on("error", ()=> clearTimeout(timeoutId))//porque aqui se aplcian 2 timneout y como se relaciona con el codigo 
    startTimeout();
    return nodeStream//una epxlcuacion de la utilidad y funcionamiento de las 2 ultimas 2 lineas y  relacion con el codigo 



}




}
 */