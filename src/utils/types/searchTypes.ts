//Define prioridades como tipo literal(mejro autocompletado )
export type ErrorPriority = "low"|"medium"|"high"|"critical"

//Interfaz base(contrato que debn cumplir todos los errores)
export interface AppErrorInterface{
    id: string; //Identificador  unico  para tracking 
    code: string; //codigo maquina (ej NETWORK_ERROR)
    technicalMessage: string ; //mensaje tecinco para logs //me surge duda porque varias veces e visto que el manejo de errores  es relacionado con los logs pero no  entiendo pq  esa relacion? 
    userMessage: string;
    priority: ErrorPriority; //nivel de urgencia
    timestamp: number //Unix timestamp para analisis  temporales //Quiesiera comprender mejor y a mas a grandes rasgos como estyo afecta ? como es util ? y porque necsariamente number mas que nada para eneteneder motivos y racionalidad
    metadata?: Record<string, unknown>;//datos adicionales estructurados//entiendo que es para objetos con keys de string y valor uknown y que es opçional pero siendo ese el caso porque de esta manera? como afecta? y como es util la utilizacion de esto? 
}

interface AbilitiesType{
    ability:{
        name: string
    }
}

export interface PokeDataType {
  name: string;
  abilities:   AbilitiesType[]
}
