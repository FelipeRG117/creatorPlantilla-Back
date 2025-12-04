import { CloudinaryUploadResult, CloudinaryConfig, ExtendedUploadApiResponse, Logger, NodeReadableStream, SensitiveKeyPattern, StreamConverter, WebRedeableStream, LogMetadata, CodeError } from "@/lib/config/types/env";
import { SecureStreamConverter } from "../SecureStreamConvert";
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse} from "cloudinary";
import crypto from "crypto"
import { UploadError } from "@/lib/config/errors";
import { pipeline } from "stream/promises";
import { CircuitBreaker } from "./circuitBaker";
import { MetricService } from "@/lib/observability/MetricService";





export class CloudinaryUploader {

    private readonly streamConverter: StreamConverter;
    private readonly circuitBreaker: CircuitBreaker; 
    private readonly metrics: MetricService; 

    constructor (
        private readonly config: CloudinaryConfig, 
        private readonly logger: Logger,
        private readonly metricService: MetricService,//porque se agregarn esos campos en el cosntructor y como se relaciona con las poropiedades de la clase
        private readonly options: {timeoutMs?: number} = {} 
    ){
        //configuracion con timeout ajustable por entorno 
        this.streamConverter = new SecureStreamConverter(
            options.timeoutMs || 30000
        );
this.metrics = metricService; 
this.circuitBreaker = new CircuitBreaker(
    logger, 
    metricService, 
    5, 
    30000, 
    3
)//aqui porque  se instancia la ppropiedad como una nueva ademass de que entonces es posible utilizar las clases como interfaces sin necesidad de cerar una especifica con ts ? 
        this.initialize();
        this.verifyConfig();
//una epxlciacion detallada del porque de cada linea de dentro del cosntructor 
    }

    



    private initialize(): void {
        cloudinary.config({
            cloud_name: this.config.cloudName, 
            api_key: this.config.apiKey, 
            api_secret: this.config.apiSecret
        })
    }

    private verifyConfig(): void{
        const MIN_KEY_LENGTH =14;
        const REQUIRED_PREFIX = "CLD_"

        //validcion profesional con redaccion segura 
        if(!this.config.apiKey || this.config.apiKey.length < MIN_KEY_LENGTH){
            const errorDetails = {
                expectedLength: MIN_KEY_LENGTH, 
                actualLength: this.config.apiKey?.length || 0, 
                redactedKey: this.redactKey(this.config.apiKey)
            }
            this.logger.error("Invalid API Key Length", errorDetails)
            throw new UploadError(
                "Invalid Cloudinary configuration", 
                "error in configuration", 
                "CONFIG_ERROR", 
                "high", 
                true, 
                errorDetails
            );
        }

        if(!this.config.apiKey.startsWith(REQUIRED_PREFIX)){
            const errorDetails = {
                expectedPrefix: REQUIRED_PREFIX, 
                redactedKey: this.redactKey(this.config.apiKey)
            }//porque se hace esta valdiacion y como se relaciona con el codigo 

            this.logger.error("Invalid API Key format", errorDetails)
            throw new UploadError(
                "CONFIG_FORMAT_INVALID", 
                "Invalid API Key format", 
                "CONFIG_ERROR", 
                "critical", 
                false, 
                errorDetails
            )
        }



    }
    

//redaccion irreversible con hash criptografico 
    private redactKey(key: string | undefined): string{
        if(!key) return "redacted_****"; 
        //Gnera hash unico no reversible 
        return `redacted_${crypto.createHash("sha256")
            .update(key)
            .digest("hex")
            .slice(0, 8)
        }`//porque se realiza de ets a manera y si cumple con las normas antes aclaradas y buscadas ?
    }



public async upload (file: File): Promise<CloudinaryUploadResult>{
return this.circuitBreaker.execute(async ()=>{
        
 const startTime = performance.now();
 const correlationId = crypto.randomBytes(8).toString("hex")
 const logContext: LogMetadata = {
    fileName: file.name, 
    size: file.size, 
    mimeType: file.type, 
    correlationId
 }//una epxlciacion de porque estas perimas lineass se realizan de esta forma que recibenm y que entregan y porque ? y porque es mejro que la anteiror funcion  
 this.logger.info("Starting upload", logContext);//porque se llama logger en este punot?y porque de cada linea anetrior y porque aqui ny no antes o depsues ?
 try {//porque se hace asincronicamente la funcion 
  
        const webStream = file.stream(); 
        const nodeStream = this.streamConverter.convert(webStream)//pórque estas dos lineas dse hacen de etsa manera especificamente ? 
        if(!nodeStream || typeof nodeStream.pipe !== "function"){//porque se valida exctamente estos valores en el if 
            throw new UploadError(
                "INVALID_STREAM_CONVERSION", 
                "Converted stream is invalid", 
                "STREAM_ERROR", 
                "critical", 
                true, 
                {fileName: file.name}//porque se envia esto en el upload en error despues de valdiar estos datos en el if ?
            )
        }
        const result = await this.processUpload(nodeStream, file)//por que se reLiza esta linea depsues del if y como se relaicona con la funcion de uplaod 
        const duration = performance.now() - startTime; //porque se hace el duartion de esta manera y como es el sentido de esto ?
/* 
        //Metricas profesionales 
        this.metrics.reportUploadSuccess(
            file.size, 
            duration, 
            file.type, 
            logContext
        )///porque se envia esto que envia exactamente y porque se considera una metric aprofesional ?
        this.metrics.reportUploadPerfomance(
            duration, 
            file.size, 
            logContext
        )//porque se realzai otro metric y porque se hace el llamado a estas dos funciones del servicio de mtrics ? y porque se envia luego el valor de result despues de esto y qque devuelve¡?
 *///porq eue  esto es peor que el nuevo mensaje de meric Serice 
this.metrics.reportUploadSuccess(
   file.size, 
   duration, 
   file.type,
    {
        fileName: file.name, 
        correlationId: correlationId
    }
)//que se esta enviando en metric y que devuelve y porqe se hace de esta manerab y porque es mejor que la version anterior ?

this.metrics.reportUploadPerfomance(
            duration, 
            file.size, 
            {
                fileName: file.name, 
                correlationId
            }//porque es mejor asi que la version entrior
        )


        return result //
   
 } catch (error) {
    const duration = performance.now() -startTime //porque se ahce el duration de esta manera y como se relaicona con el try y si sea cre4a uno nuevo o comos eria el rpvoceso eteniedno en cuenta el exito o fallo ?
    const errorCode = error instanceof UploadError ? error.code : "UNKNOWED_ERROR"//Porque se valida de esta manera ?
   /*  this.metrics.reportUploadError(
        errorCode as CodeError, 
        duration, 
        {
            ...logContext, 
            state: this.circuitBreaker.getState()
        }
    ) *///una epxciaicon de porque devukleve esto el mensaje de reportUploadError qademas de que esta deovliendo y que esta recibiendo 
//reportar error a metricas 
this.metrics.reportUploadError(
    errorCode,
    duration, 
    {
        fileName: file.name, 
        correlationId
    }
);//porque se envia eszto que recibe y que devuelve y pórque es mejor que la version anterior ?

    throw error;//es correcto mostrar este mensaje de throw error? y porque ?y si cumple con los apramweretors  de calidad 
 }
})
}

private async processUpload (
    stream: NodeReadableStream, 
    file: File
): Promise<CloudinaryUploadResult>{
return new Promise((resolve, reject)=>{

    const timeout = this.calculateDynamicTimeout(file.size);//como se relaicona con el emtodo y como se relacuiona con el codigo 

//timeout glocbal paara toda la operacio n 
const operationTimeout  = setTimeout(()=>{
reject(new UploadError(
    "Upload timed out after 45s", 
    "Upload too long", 
    "CONFIG_ERROR", 
    "high", 
    true, 
    {fileName: file.name}
))
}, timeout)

const cleanup = () => clearTimeout(operationTimeout)
 //porq ue se hace aqui esta oepracion
 const uploadStream  = cloudinary.uploader.upload_stream(
    {resource_type: "auto"},
    (error, result)  =>{
        cleanup();
        if(error){
            this.handleCloudinaryError(error, file,  reject)
        }else if (!result) {
            reject( new UploadError(
                "CLOUDINARY_EMPTY_RESPONSE", 
                "Empty response from Cloudinary", 
                "SERVER_ERROR", 
                "high", 
                true, 
                {fileName: file.name}
            ));
        }else {
            resolve(this.mapResult(result))
        }//quisiera una epxlciacion profunda de cada linea funcionamietno porque se relazia de esta  manera como se relaciona con el codigo ademas de como afecta y su importancia ademas de com aplciarla correctamente y cuando aplciar estea estructura adecuadamente y con buenas practicas y en que situaciones realizarlo de esta manera ? 
    }
 ); 

if(!stream || typeof stream.pipe !== "function"){
    throw new Error("El sttream de entrada no es valido ")
}
if(!uploadStream || typeof uploadStream.write !== "function"){
    throw new Error("El uploadStream no es valido");
}


 pipeline(stream, uploadStream)
  .catch(error => {
    cleanup()
    reject(error)
  })
/*  .catch((error: unknown) => {
    cleanup();
    reject(error); ///////esta fue la froma sugerida inciial y quisiera unca eplxciaicon de porque de  esta ffroma y si es mejor o pero que esta utlima que se utilizo 
 });  */
 
});

}

private calculateDynamicTimeout(fileSize: number): number{
    if(fileSize > 1_000_000_000) return 120_000 //porque esto es 120s para >    1GB como se relaciona o se pesa el peso del archivo ????
    return 45_000 //45s defualt 
}



private handleCloudinaryError (
    error: UploadApiErrorResponse, 
    file: File, 
    reject: (reason: UploadError)=> void//porque se puede utilizar una funcion de clase como inetrafce de tipado???Verificar
): void{
const errorContext = {
    fileName: file.name, 
    hhtpCode: error.http_code, 
    errorName: error.name, 
    redactedKey: this.redactKey(this.config.apiKey)
}//porque ze hace esta configuracion y como se relaciona en el codigo y ventajas o del porque esta forma de crear esta funcion proposito y si cumple con los estandares 
this.logger.error("Cloudinary API error", errorContext)
reject(new UploadError(
    error.message, 
    "Error in upload", 
    "CONFIG_ERROR", 
    "high", 
    false, 
    {meta: errorContext}//porque casi la mayoria de als funcionesz siguen esta estructura que porposito y como se relaicona con l codigo y si cumplen con la caldiad esperada y buscada 
))
}

private mapResult(result: UploadApiResponse): CloudinaryUploadResult{
const {secure_url, public_id, width, height, bytes }= result

if(!secure_url || !public_id ){
throw new UploadError(
    "INVALID_CLOUDINARY_RESPONSE",
    "Invalid Cloudinary response",
    "SERVER_ERROR", 
    "medium", 
    true, 
    {response: this.redactReponse(result as ExtendedUploadApiResponse)}  
);
}

return {
    url: secure_url, 
    publicId: public_id, 
    width: width ?? 0, ///porque se utiliza el ?? y luego el 0 ademas cuando ocupar esto de manera correcta 
    height: height ?? 0, 
    size: bytes ?? 0
}


}


//8-Redaccion de respuesta sensible 
//fuincion de redaccion profesional mejorada 
private redactReponse(response: ExtendedUploadApiResponse): Partial<ExtendedUploadApiResponse>{

const topLevelSensitiveFields:  (keyof ExtendedUploadApiResponse)[]  = ["api_key", "signature"]; 

const sensitiveKeyPatterns: SensitiveKeyPattern[] = ["key", "token", "secret", "password", "auth"]; 

//clonado inmutable cpon tipado seguro
const redacted: ExtendedUploadApiResponse = {...response}
//Redaccion de campos de primer nivel 
topLevelSensitiveFields.forEach(field=> {
    if(field in redacted && redacted[field]){
        redacted[field] = "***";
    }
});//una explciacion de este metodo y del porque y como fucniona y porque se le asigna el valor de  "***" al campo de redacted en la clave de field 

//funcion de redaccion profunda con tipado fuerte 
const deepRedact  = (obj: Record<string, unknown>): Record<string, unknown> => {
return Object.entries(obj).reduce((acc, [key, value])=>{//porq eu se toman los valores de esta manera en forma de array y si tambien tiene alguna relacion con mi duda relacionada a el objeto con un valor de rarray en la key ?
    ///Deteccion segura de campos sensibles
    const isSensitive = sensitiveKeyPatterns.some(pattern => key.toLocaleLowerCase().includes(pattern));///porque se relacioan de eesta manera y que significa y como se relaciona con el codigo 
//Procesamiento recursivo seguro 
let processedValue = value; 
if(value && typeof value === "object"){
if(Array.isArray(value)){
    processedValue = value.map(item=> typeof item === "object" && item !== null ? deepRedact(item as Record<string, unknown>): item )//porque se hace de esta manera y porque es mejor que la anterior 
   /*  processedValue = value.map(item => typeof item === "object" ? deepRedact(item as Record<string, unknown>): item )antes tenia que utilizar este metodo que se suponia era el mejor pero se me sugirio otra y no se si realmente sea asi y  si de verdad cumplea o supera los parametros buscados  *///que ignica al utilizar la misma funcion dentro de la misma osea pq se hace esto y si es uyea practica y segun que casos aplciarla correctamente y como difrenciar si es buena practica o no 
}else {
    processedValue = deepRedact(value as Record<string, unknown>)//porque se utiliza la funcion de esta manera y dentro de la msima no crearia un loop?
}
}

return {
    ...acc, 
    [key]: isSensitive ? "***" : processedValue
}
}, {})//antes de incializar el acc como objeto me marcaba error pero ahora que lo puse ya no, tecnicamente estaba parta ser asi pero quisiera una explciacion del porque me marcaba error al no utilzialro 
};


//aplicar redaccion profunda 
const deepRedacted  = deepRedact ( redacted) as Partial<ExtendedUploadApiResponse>; //porque sse envia aqui la uifnrmacion y de esta manera y como se lrelaciona con la funcion y el codigo 

//redaccion especifica  para URLs en transformacion eager
//que es la transformacion eager y como afecta y rse relaciona con el codigo y la impoertancia de esta 
if(Array.isArray(deepRedacted.eager)){
deepRedacted.eager = deepRedacted.eager.map(transformation => ({
    ...transformation, 
    url: "***", 
    secure_url: "***"
}));///pq se realiza de esta forma Y CUAL es la razon y como cumple su porposito  ty relacion  con el codigo y efecto 
}
   return deepRedacted; 

}

private handleUploadError (error: unknown, file: File): never{//cuando utilizar correctamente never 
    //normalizacion profesional 
    const normalizedError = error instanceof Error ? {message: error.message, stack: this.redactStack(error.stack)} : error;

    //Contexto enriquecido 
    const errorContext = {
        fileName: file.name, 
        size: file.size, 
        mimeType: file.type, 
        error: normalizedError
    }

    //log Esstructurado 
    this.logger.error("Upload  failed", errorContext)

    //Relanzamiento seguro 
    if(error instanceof UploadError){
        throw error
    }//porque especificamente UplaodError 
    throw new UploadError(
        "UPLOAD_ERROR", 
        "Upload_error", 
        "CONFIG_ERROR", 
        "critical", 
        false,
        {}
    )

}

private redactStack(stack?: string): string {
    return stack?.replace(/api_key=\w+/g, `api_key=***`) || "No stack"//que significa esta linea porque es ta   util y porque si quio al menos una barra esto me produce fallo que hace o porque se construye de esta manera especifica y donde mas se  lllega  a utilizar esta misma porpiedad /api_key=\w+/g ?
}



}










/* 
public async upload (file: File): Promise<CloudinaryUploadResult>{
  return this.circuitBreaker.execute(async ()=> {//aqui tuve que encerrar toda la funcion de upload en la fucion proporcionada por circuitBreaker pero descopnozco la razon efcetos y como ayuda y lass didferencias de tenerlo o no enecerrado en esta funcion yccuando aplciar casos similares 

      const startTime = performance.now();//porque es mas preciso que Date.now()?
    const logContext = {
        fileName: file.name, 
        size: file.size, 
        mimeType: file.type
    }//dendonde provienen   esta estructura coom se relaciona con el codigo y porque se realiza de esta manera y poroque es optmia en esta construccion
    this.logger.info("Strating upload", logContext)
    try {
        const webStream = file.stream();
        const nodeStream = this.streamConverter.convert(webStream);

//verificacion profesional de Integridad 
if(!nodeStream || typeof nodeStream.pipe !== "function"){//porque esto se consideraria una verificacion profesional de Integridad? 
throw new UploadError(
    "INVALID_STREAM_CONVERSION", 
    "Converted stream is invalid", 
    "STREAM_ERROR", 
    "critical", 
    true, 
    {fileName: file.name}
)
}


        const result = await this.processUpload(nodeStream, file)//porque se pasan estos datos en al funcion? 
        //Metricas de rendimiento 
        const duration = performance.now() - startTime; //cual es l;a razon de que se haya construido asi y el impacto en el codigo 
       /*  this.logger.metric("upload_success", duration, {
            ...logContext, 
            duration
        }) antes tenia con metric ahora utilizare info ya que por sugerencia es mejor al parecer  *///arrgelar el tipado en la interface de Logger 
/* this.logger.info("upload_succes", {
    ...logContext, duration
})//este al parecer es mejor que metirc pero porque debria  y porque ?
por que este es inferior al nuevo logger que estoy utilizando ? 
this.logger.info("upload_success", {
    fileName: file.name,
    size: file.size,
    duration, 
    throughput: (file.size /  (duration/1000)).toFixed(2) + "B/s"//NUEVO KPI pero a que se refiere con KPI y porque esto es  mejor que el anteior y donde utilzair  esa construccion de logger ? 
})
return result 

    } catch (error) {
        console.log(error)
        //Manejo consistente de errores 
        throw this.handleUploadError(error, file)//como es la logica para que se muestre  y tenga  concordancia el metodo y la necesidad de utilizarlo  aqui
    }

  })
} */





































/* ////ESTO SE DIVIDIRA EN 3 PARTES
import { UploadError } from "@/lib/config/errors";
import { CloudinaryaUploadResult as CloudinaryUploadResult, CloudinaryConfig, Logger } from "@/lib/config/types/env";
import { handleTransformError } from "@/utils/handleTransformError";
import { normalizeErrorsForLogs } from "@/utils/normalizeErrorsForLogs";
import { v2 as cloudinary, UploadApiResponse, UploadStream } from "cloudinary";



//Servicio con DI (que es DI)

export class CloudinaryUploader{
    constructor(private config: CloudinaryConfig, private logger: Logger){
        this.initialize()
        this.verifyConfig()//se puede llamar a una funcion dentro del sconstructor sin instanciar el valor que llega a constructor ? como afecta eso y cuando se puede utilizar y de que forma esto es mas optimo pára produccion ademas de que cual es la forma amas optima y porque
    }

private initialize(){
   cloudinary.config({
    cloud_name: this.config.cloudName, 
    api_key: this.config.apiKey, 
    api_secret: this.config.apiSecret
   })
}
 *//* 
    private verifyConfig(){
if(!this.config.apiKey || this.config.apiKey.length < 10 ){
    this.logger.error("API Key demasiado corta o vacia", {
        apiKey: this.config.apiKey
    });//que es lo que spera esta funcion porque se envia de esta manera y el sentido de esto
    throw new Error("INVALID_CONFIGURATION")//es profesional o correcto enviar este mensaje de esta manera o devolver este mensaje de error? p valdiarlo de esta manera?
} */


       /*  if(!this.config.apiKey.startsWith("CLOUD")){
           // throw new Error("Fomrato API Key invalido")//aqui pdoemos manejarlo con otra clase que sera la de NETWORKError //error aqui se manejara de tora mejor forma mejor que esta incial   
           this.logger.error("Invalid API Keey format", {
            apiKey: this.config.apiKey, 
            expectedPrefix: "CLOUD"
           });
           throw new Error("INVALID_CONFIGURATION")//aqui tendira que ser NetworkError osea deberia crear una normalizacion de erroroes y la creacion de classes ya sea de  nwtowk o type  error o global error etc y los errores que deba manejar
        }  */
   /*  }//se hace private para que solo se pueda utiliza dentro del contetxo de la miusma clase pero cual es el senido de poner esto privado y las demas publcias 

    public async upload(file: File): Promise<CloudinaryUploadResult>{
        this.logger.info("Starting upload", {fileName: file.name});
        try {
//conversion segura de tipos 
const webStream = file.stream() as unknown as ReadableStream;//ES SEGURO? FUNCIONA EN RUNTIME ? QUE HACE Y DE DODNE PROVIENE ESETE TIPO Y COMO SE RELACIONA CON EL CODIGO
//const nodeStream = Readable.fromWeb(webStream)
/* const  buffer = Buffer.from(await file.arrayBuffer());
const nodeStream = Readable.from([buffer]) */
/* ////////////////////////aqui se ccreara la nueva implementacion 

const webToNodeStream = (webStream: RedeableStream): Readable=>{
return Readable.from(webStream);
} */

/* ///uso en  CloudinaryUploader: 
const nodeStream = webToNodeStream(file.stream())
nodeStream.pipe(UploadStream) */


 
/* 

           // const buffer = await file.arrayBuffer()//esto que hace y porque 
            const result = await cloudinary.uploader.upload(`data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`,{resource_type: "auto"})////una explciacion del porque de cada propiedad/metodo/valor utilizado y como utilziarlo o configurarlo correctamente 

            this.logger.debug("Upload successful", {
                publicId: result.public_id, 
                size: result.bytes
            })//me di cuenta que hay diferentes metodos para logger como difreneciar cada uno cuando utilizar uno que significa cada uno y porque utilziarlos en ciertas partes como aqui ademas de su efecto a la hora dde utilziarlo y  utilzarlo de esta amnera 
           // return result.secure_url
           return new Promise((resolve, reject)=> {
            const uploadStream = cloudinary.uploader.upload_stream({resource_type: "auto"}, (error, result)=>{
                if(error){
                    reject(new UploadError(error.message, "Error al subir", "UPLOAD_ERROR", "high", false, {
                        fileName: file.name, 
                        httpCode: error.http_code, 
                        errorName: error.name
                    }))
                }else if(!result){
                    reject( new UploadError("Respuesta vacia de  cloudinary", "Respuesta invalida", "SERVER_ERROR", "high", false, {fileName: file.name}))
                }else{
                    resolve(this.mapResult(result))
                }
            })

            nodeStream.pipe(uploadStream)//que esta propiedad que hace y porque s utiliza aqui
           })


           


        } catch (error) {
            console.log(error)
            const tranformError = normalizeErrorsForLogs(error)
            this.logger.error("Upload failed", {
                fileName: file.name, 
                error: tranformError, //aqui no hay problema de poner en error un array
                stack: error instanceof Error? error.stack : undefined
            })//aqui me dice que errror es unknown ademas de como se puede configurar este error y si tiene propiedades esperadas y  si es correcto construirla de esta maneray que es lo que espera realemnte ademas de que como se relaciona el file y los mensajes de error  con la ocnstruccion del mensaje de llogger de  error 

            //throw new Error("UPLOAD_FAILED")//aqui deberia ser NetworkError//realmente es  correctto mostrar un error de  esta manera aunque fuese de la clase de Network error????
throw  new UploadError(
    "UPLOAD_FAILED", 
    "Error tecnico al subir archivo", 
    "UPLOAD_ERROR", 
    "high", 
    false, {}//configurar bien aqui el campo 
)

        }


        
    }

//,mapeo seguro con valdiacion
//com afecta esto y como funcciona y porque se utiliza?
private mapResult = (result: UploadApiResponse): CloudinaryUploadResult=>{
    if(!result.secure_url || !result.public_id){
        throw new UploadError("Respuesta invalida de cloudinary", "Respuesta invalida", "SERVER_ERROR", "medium", false, {
            resultResponse: result
        })
    }

    return {
        url: result.secure_url, 
        publicId: result.public_id, 
        width: result.width ?? 0, 
        height: result.height ?? 0 ///el valor ?? que hace porque se utiliza aqui y como afecta esta funcion al codigo y cuando aplciar este tipo de metodo y porque luego s e utiliza el 0 
    }
}




}

 */