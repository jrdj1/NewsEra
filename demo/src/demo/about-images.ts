/**
 * Fotografías reales para las 8 pantallas de /about, todas de Wikimedia
 * Commons (dominio público o licencia libre, verificado individualmente —
 * URL directa + licencia comprobadas antes de usarlas). El tratamiento
 * visual vintage (blanco y negro / tono sucio) se aplica de forma
 * uniforme vía CSS (ver VINTAGE_FILTER en About.tsx), no por edición de
 * los archivos originales.
 */
export interface AboutImage {
  url: string;
  alt: string;
  /** Solo si la licencia exige atribución (CC BY / CC BY-SA). */
  credit?: { text: string; href: string };
}

export const ABOUT_IMAGES: Record<string, AboutImage> = {
  problema: {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/33/Lino_Deadline_-_Printing_Press_Room_of_the_Key_West_Citizen_newspaper%2C_early_1960s.jpg",
    alt: "Sala de prensa de un periódico, con las rotativas en marcha, hacia 1960",
    credit: {
      text: "State Library and Archives of Florida, CC BY 2.0",
      href: "https://commons.wikimedia.org/wiki/File:Lino_Deadline_-_Printing_Press_Room_of_the_Key_West_Citizen_newspaper,_early_1960s.jpg",
    },
  },
  solucion: {
    url: "https://upload.wikimedia.org/wikipedia/commons/d/df/Crowd_people.jpg",
    alt: "Una multitud de personas",
  },
  verdad: {
    url: "https://upload.wikimedia.org/wikipedia/commons/1/13/The_Jury_%281861%29.jpg",
    alt: 'Pintura "The Jury" (1861), un jurado deliberando',
  },
  pilares: {
    url: "https://upload.wikimedia.org/wikipedia/commons/7/79/Columns_at_Luxor_Temple.JPG",
    alt: "Columnas del templo de Luxor, en pie desde hace más de 3000 años",
    credit: {
      text: "Ad Meskens, CC BY-SA 3.0",
      href: "https://commons.wikimedia.org/wiki/File:Columns_at_Luxor_Temple.JPG",
    },
  },
  innovacion: {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Illuminated_Incandescent_Bulb.jpg",
    alt: "Una bombilla incandescente encendida",
  },
  blockchain: {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/37/Bank_account_book%2C_issued_by_Petty_and_Postlethwaite_for_use_in_Cumbria%2C_UK._1st_entry_1831%2C_last_entry_in_1870._On_display_at_the_British_Museum_in_London.jpg",
    alt: "Libro de cuentas bancario del siglo XIX, con entradas desde 1831 hasta 1870",
    credit: {
      text: "British Museum, CC BY-SA 4.0",
      href: "https://commons.wikimedia.org/wiki/File:Bank_account_book,_issued_by_Petty_and_Postlethwaite_for_use_in_Cumbria,_UK._1st_entry_1831,_last_entry_in_1870._On_display_at_the_British_Museum_in_London.jpg",
    },
  },
  memoria: {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Library_book_stacks.jpg",
    alt: "Estanterías de una biblioteca llenas de libros",
  },
};
