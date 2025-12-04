import { z } from "zod"

//definir tipos sgeuros primero 
export const SUPPORTED_MIME_TYPES = [
    "image/jpeg", 
    "image/png", 
    "image/webp"
] as const //proque crearlo de esta manera 
export type SupportedMimeType = typeof SUPPORTED_MIME_TYPES[number]//porque utilizar typeof aqui  siendo que solo  devolvera si es string o el ttipo  del valor que  etsa recibiendo en como clave del objeto 

//esquema de va;Lidacion con tipos fuertes 
export const FileSchema  = z.object({
    name: z.string().min(1, "Nombre de archivo requerido"), 
   type: z.custom<SupportedMimeType>(val=> SUPPORTED_MIME_TYPES.some(mime=> mime === val), 
   {message: "Tipo de imagen no soportado"}),//que es lo quue esta haciendoe sta funcion y ocmo se relaciona y afecta al codigo ademas de que como se confroma con el schema
    size: z.number().min(1, "Archivo vacio no permitido").max(5_000_000, "Tamano maximo 5MB"),
}).refine(data =>  data.size > 0, {
    message: "Archivo invalido", 
    path: ["file"]
})//como fuyncionaria este ultimo refine en el schema 
/*  type: z.string().refine((val): val is SupportedMimeType =>  
        SUPPORTED_MIME_TYPES.includes(val as any ), {message: "Tipo de imagen no soportado"}),//temporal correguremos pero es relamente correcto utilizar any aqui? */