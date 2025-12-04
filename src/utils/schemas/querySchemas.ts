import { z } from "zod";

export const querySchema = z.string({
    required_error: "El campo es obligatorio", 
    invalid_type_error: "Debe ser un texto"
}).min(3, {message: "Minimo 3 caracteres"}).max(90, {message: "Maximo 90 caracteres"})
.refine(async(value)=>{
//simulacion asincrona (verificar en diccionario)
await new Promise((resolve)=> setTimeout(resolve, 300))
return !value.includes("error")
}, {message: "El texto no pude contener la palabra `error` "})