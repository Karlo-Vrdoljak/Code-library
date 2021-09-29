import { EdbType } from './_interfaces/dbtypes';
import { BreadCrumb } from './_interfaces/types';
export class GlobalVar {
    prodDatabase: string = EdbType.PROD;
    
    devMode = false;
    
    korisnikIme = null;

    korisnikPkUsera = null;

    user: any;
    
    korisnikGrupe = [];
    
    korisnikPrava = [];

    isAdmin: 1|0 = 0;
    // ----- trajanjeErrAlert ---------------------------------------------------
    // definira trajanje alert-a
    trajanjeErrAlert = 5000;

    //Definirana prava za komponentu priloga
    readonly attachmentsRights = {
        download: 1,
        delete: 2,
        edit: 3
    }
};
