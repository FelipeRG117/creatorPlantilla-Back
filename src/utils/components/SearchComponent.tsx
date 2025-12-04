"use client"
import { useSearch } from "@/hooks/useSearch"
import { useCallback, useState } from "react"
import { ErrorDisplay } from "./ErrorDisplay"


export const SearchComponent = () => {
const [inputValue, setInputValue] = useState("")
const {search, abort, data, isAborted, isLoading, errors} =  useSearch()

const handleSubmit=  useCallback((e:React.FormEvent)=>{//por que usar un useCallBack en una funcion que ejecuta cuando se hgace click ?
    e.preventDefault()
    if(!inputValue.trim()) return;//que pasa al no retornar nada en vez de retrnar null? o porquese opto por esto en vez de otra cosa como null
    search(inputValue)
}, [search, inputValue])//entocnes cuando uno de los datos dentro de params cambai se vuelve a ejecutar el useCallBack o cual es su efecto o relacion con la contruccion de searcComponent y ltodo lo relacionado
//al iugal que ele fecto de utilizar y no utilziar noValidate  en form y como afceta o se relaciona con toda la construccion

const handleRetry = useCallback(()=>{
if(!inputValue.trim()) return //porque se realzia esta insecicion en ambas funciones y porrque la crezacion de esta misma y su utilidad
search(inputValue)
}, [inputValue, search])//porque tabien se validsan los mismos campos que  el handle Submit
//si pocurre un error o envio y uego trato de escribir no me deja nuevamente ingresar campos al input y quisiera un a epxlciacion del orque y que etenr en cuneta para eviatar que sucedan este tipo de cuestiones 
return (
   <div>
    <form onSubmit={handleSubmit} noValidate>
<input type="text" value={inputValue} onChange={(e)=> setInputValue(e.target.value)} disabled={isLoading} placeholder="Buscar Pokemon" id="" />
 <div>
    <button disabled={isLoading} type="submit">
        {isLoading ? "Buscando.....": "Buscar"}
    </button>

    <button type="button" onClick={abort} disabled={!isLoading}>Cancelar</button>
 </div>
{/* Resultados */}
{data && (
    <div>
        <h2>{data.name}</h2>
        <ul>
            {data.abilities.map((abilit, index)=>(
                <li  key={index}>{abilit.ability.name}</li>
            ))}
        </ul>
    </div>
)}
{/* Feedback por cancelacion*/}
{isAborted && (
    <div>
        <h3>Busqueeda cancelada por el usuario</h3>
    </div>
)}
    </form>
<ErrorDisplay errors={errors} onRetry={handleRetry}/>

   </div>
  )
}
