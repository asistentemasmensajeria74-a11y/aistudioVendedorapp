export interface UsuarioVendedor {
  USER_NUM: number;
  USER_CORREO: string;
  USER_NOMBRE: string;
  "CONTRASEÑA": string;
  USER_ROL: string; // "VENDEDOR" or admin roles
  USER_ESTATUS: string; // "ACTIVO"
  RUBRO?: string;
  "NOMBRE DE PILA"?: string;
  TELEFONO?: any;
  DIRECCION?: string;
  "DIRECCION ALTERNA"?: string;
  [key: string]: any;
}

export interface PedidoCaptura {
  id: any;
  "Marca temporal": any;
  ENVIA: string;
  "NOMBRE DE QUIEN RECIBE": string;
  "APELLIDO DE QUIEN RECIBE": string;
  DIRECCION: string;
  ZONA: string;
  TELEFONO: any;
  COBRAR: number;
  ESTADO: string;
  [key: string]: any;
}

export interface PedidoRuta {
  id: string;
  NGUIA?: string;
  ESTADO?: string;
  ENVIA?: string;
  RECIBE?: string;
  DIRECCION?: string;
  ZONA?: string;
  TELEFONO?: any;
  ACOBRAR?: any;
  [key: string]: any;
}

export interface ReporteVenta {
  id: string;
  [key: string]: any;
}
