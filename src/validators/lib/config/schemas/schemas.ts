import { z } from "zod";

//Esto se dividira en 3 partes
//esquuema de Zod con validaciones especificas
export const CloudinarySchema = z.object({
    cloudName: z.string().min(1, "Cloud name no puede estar vacio"), 
    apiKey: z.string().min(14, "API Key debe tener 14 caracteres"), 
    apiSecret: z.string().min(14, "API Secret debe tener 14 caracteres")
})

/* export const CloudinarySchema = z.object({
    cloudName: z.string().min(1, "Cloud name no puede estar vacio"), 
    apiKey: z.string().length(32, "API Key debe tener 32 caracteres"), 
    apiSecret: z.string().length(32, "API Secret debe tener 32 caracteres")
})
    export const CloudinarySchema = z.object({
    cloudName: z.string().min(1, "Cloud name no puede estar vacio"), 
    apiKey: z.string().length(14, "API Key debe tener 14 caracteres"), 
    apiSecret: z.string().length(14, "API Secret debe tener 14 caracteres")
})
este era mi antiguo schea pero mi key y password no tiene esa cantidad pero no se si esta mal eso o si soloamente debo adaptarlo a uno en elc ual coincida con mi api key y apisecret real  asiq ue lo tuve que reducir  arriba de 14 porque tienen mas de 8strings*/