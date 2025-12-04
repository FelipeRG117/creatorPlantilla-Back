import { logger } from "@/utils/logger";
import { CloudinarySchema } from "./schemas/schemas";
import { CloudinaryConfig } from "./types/env";
import { config } from "process";
import { redactSecrets } from "@/lib/config/security/redactSecrets";
import { ConfigError } from "./errors";

//function principal para obtener la configuracion
export const getCloudinaryConfig=(): CloudinaryConfig=>{
//leeer las variables de entorno 
const rawConfig = {
    //leeer las variables de entorno
    cloudName: process.env.CLOUDINARY_CLOUD_NAME, 
    apiKey: process.env.CLOUDINARY_API_KEY, 
    apiSecret: process.env.CLOUDINARY_API_SECRET
}
//validar con zod 
const result = CloudinarySchema.safeParse(rawConfig)//aqui no es asyn porque ya se tienen los dtaos de manera sincrona

//Manejar errores de valdiacion 
if(!result.success){
    const errorDetails = result.error.errors.map(err => `${err.path.join(".")}: ${err.message}`).join(`\n- `)

    logger.error("Configuration Cloudinary ", {
        errors: errorDetails, 
        config: redactSecrets(rawConfig)//aqui porque utilziar este emtodo en la configuarcion que fue fallida ademas  de que en si que etsa recibiedno y si es buena pratcica realizarlo de eta manera 
    })

    //throw new Error(`Configuration Cloudinary invalida:\n- ${errorDetails}`);//esto porque se utiliza :\n- en esta parte efectos y consecuencias y razoznde ser asi y mostrar el me nsaje  de  esta forma 
    throw new ConfigError(
        result.error.message, 
        "Hubo un error en la configuracion de cloudinary", 
        "CONFIG_ERROR", 
        "high", 
        false
    )

}

logger.debug("Configuration Cloudinary cargada correctamente");
return result.data; 

}

//esto no se donde utilziarlo o si realmente seria buena practica esta funcion 
 const initializeCloudinary=()=>{
    try {
        const config = getCloudinaryConfig();
        logger.info("Cloudinary inicializado", {cloudName: config.cloudName});/// y cloudName es parte de la ifnroamcionesperada de la funcion de info 
        return config
    } catch (error) {
        logger.fatal("Fallo en inicializacion de cloudinary", {error})
        process.exit(1)
        console.log(error)
    }
}


