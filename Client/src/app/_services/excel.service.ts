import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WSA_E_CANCELLED } from 'constants';
import { Cell, Row, Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
import { AdministracijaUser, clanoviDataForExcel, UserClaims } from '../_interfaces/types';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(
    private appService: AppService,
    private translate: TranslateService) { }

  public generateExcel(title: string, worksheetName: string, headerLabels: string[], data: any[][], subTitle?: string): Workbook {
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet(worksheetName);

    let titleRow = worksheet.addRow([title]);
    //Definicija fontova i pozicioniranja za naslov
    this.styleTitleRow(titleRow);

    worksheet.addRow([]);

    worksheet.addRow([this.translate.instant("EXCEL_DATUM_KREIRANJA") + this.appService.localeDate(new Date(), true)]);

    if (subTitle) worksheet.addRow([subTitle]);

    worksheet.addRow([]);

    //Merge za naslov (title)
    worksheet.mergeCells('A1:D2');

    let headerLabelsRow = worksheet.addRow(headerLabels);
    //Postavljamo background boju i bordere za red koji sadrzi header labele
    this.styleHeaderLablesRow(headerLabelsRow);

    worksheet.addRows(data);

    this.adjustCellWidth(worksheet);

    return workbook;
  }

  public exportExcelFile(wb: Workbook, fileNameWithExtension: string) {
    wb.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, fileNameWithExtension);
    });
  }

  private adjustCellWidth(ws: Worksheet): void {
    ws.columns.forEach((column) => {
      let maxLength = 0;
      column["eachCell"]({ includeEmpty: true }, (cell) => {
        let columnLength = 0;

        if (cell.value) {
          //Za datume je potrebno formatirati ih kako nam celija nebi ispala presiroka
          //Za formatiranje koristimo isti format kao i defaultni excelov
          if (cell.value instanceof Date) {
            columnLength = cell.value.toLocaleDateString("en-US").length;
          } else {
            columnLength = cell.value.toString().length;
          }
        } else {
          columnLength = 10;
        }

        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 1;
    });
  }

  private styleTitleRow(titleRow: Row): void {
    titleRow.font = { name: 'Times New Roman', family: 1, size: 18, underline: 'double', bold: true, italic: true, color: { argb: '3730A3' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  private styleHeaderLablesRow(header: Row) {
    header.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'b3c6e0' }
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    });
  }



  //#region CLANOVI EXPORT

  public getHeaderLabelsForClanoviExport(): string[] {
    return [
      this.translate.instant("OIB"),
      this.translate.instant("IME"),
      this.translate.instant("PREZIME"),
      this.translate.instant("JMBAG"),
      this.translate.instant("CLANSTVO"),
      this.translate.instant("DATUM_RODJENJA"),
      this.translate.instant("SPOL"),
      this.translate.instant("EMAIL"),
      this.translate.instant("MOBITEL"),
      this.translate.instant("GRAD"),
      this.translate.instant("ADRESA"),
      this.translate.instant("DRZAVA")
    ];
  }

  //Treba paziti da su property dodani u niz istim redoslijedom kako su definirane i labele u funkciji getHeaderLabelsForClanoviExport
  public getDataForClanoviExport(clanovi: clanoviDataForExcel[]): any[][] {
    const dataToExport: any[][] = [];

    clanovi.forEach(clan => {
      dataToExport.push([
        clan.OIB,
        clan.ImeUsera,
        clan.PrezimeUsera,
        clan.JMBAG,
        clan.VrstaClanstvaNaziv,
        (clan.DatumRodenja && !clan.PrivatnostPodataka) ? new Date(clan.DatumRodenja) : clan.DatumRodenja,
        clan.Spol,
        clan.Email,
        clan.Mobitel,
        clan.Grad,
        clan.Adresa,
        clan.NazivDrzave
      ]);
    });

    return dataToExport;
  }

  //#endregion CLANOVI EXPORT

  //#region ANKETA EXPORT
  public getHeaderLabelsForAnketaExport(): string[] {
    return [
      this.translate.instant("QUESTION"),
      this.translate.instant("VRSTA_PITANJA"),
      this.translate.instant("OBAVEZNO"),
      this.translate.instant("ODGOVOR"),
      this.translate.instant("BROJ_ODGOVORA")
    ];
  }

  public getDataForAnketaExport(pitanja: any[]): any[][] {
    const dataToExport: any[][] = [];

    pitanja.forEach(pitanje => {
      pitanje.odgovoriStats.forEach(odgovor => {
        dataToExport.push([
          pitanje.PitanjeTekst,
          this.translate.instant(pitanje.tipPitanjaNaziv),
          pitanje.PitanjeObaveznoDaNe ? this.translate.instant('DA') : this.translate.instant('NE'),
          odgovor.OdgovorTekst ? odgovor.OdgovorTekst : odgovor.AnonimniOdgovorTekst,
          odgovor.BrojKandidataKojiSuOdabraliOdgovor
        ])
      });
    })

    return dataToExport;
  }
  //#endregion ANKETA EXPORT

  //#region ADMINISTRACIJA EXPORT
  public generateAdministracijaExcel(title: string, worksheetName: string, headerModulLabels: string[], headerLabels: string[], data: any[][]): Workbook {
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet(worksheetName);

    let titleRow = worksheet.addRow([title]);
    //Definicija fontova i pozicioniranja za naslov
    this.styleTitleRow(titleRow);

    worksheet.addRow([]);

    worksheet.addRow([this.translate.instant("EXCEL_DATUM_KREIRANJA") + this.appService.localeDate(new Date(), true)]);

    worksheet.addRow([]);

    //Merge za naslov (title)
    worksheet.mergeCells('A1:D2');

    //Merge za module i prazninu prije samih modul labela
    worksheet.mergeCells('A5:F5');
    worksheet.mergeCells('G5:I5');
    worksheet.mergeCells('J5:L5');
    worksheet.mergeCells('M5:N5');

    //Niz svih celija modul labela kako bi bindali vrijednost i style
    const modulLabelsCells = [worksheet.getCell('G5'), worksheet.getCell('J5'), worksheet.getCell('M5'), worksheet.getCell('O5')];

    for (let i = 0; i < modulLabelsCells.length; i++) {
      modulLabelsCells[i].value = headerModulLabels[i];
    }

    this.styleHeaderModulLabelsAdministracija(modulLabelsCells);

    let headerLabelsRow = worksheet.addRow(headerLabels);
    //Postavljamo background boju i bordere za red koji sadrzi header labele
    this.styleHeaderLablesRow(headerLabelsRow);

    // Dodavanje podataka i uvjetno bojanje celija
    data.forEach(d => {
      let row = worksheet.addRow(d);
      row.eachCell(cell => {
        if (cell.value === false) {
          
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF9999' }
          }   
          cell.value = null;

        } else if (cell.value === true) {
          
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF99FF99' }
          }  
          cell.value = null;
        }

        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      });
    })

    this.adjustCellWidth(worksheet);

    return workbook;
  }

  public getHeaderModulLabelsForAdministracijaExport(): string[] {
    return [
      this.translate.instant('FORUM'),
      this.translate.instant('DIGITALNABIBLIOTEKA'),
      this.translate.instant('ANKETE'),
      this.translate.instant('OBAVIJESTI')
    ];
  }

  public getHeaderLabelsForAdministracijaExport(): string[] {
    return [
      this.translate.instant('PREZIME'),
      this.translate.instant('IME'),
      this.translate.instant('USERNAME_ABBR'),
      this.translate.instant('CLANSTVO'),
      this.translate.instant('ADMIN'),
      this.translate.instant('BLOKIRAN'),
      this.translate.instant('KATEGORIJA'),
      this.translate.instant('OBJAVA'),
      this.translate.instant('KOMENTAR'),
      this.translate.instant('KATEGORIJA'),
      this.translate.instant('DATOTEKA'),
      this.translate.instant('KOMENTAR'),
      this.translate.instant('PREDLOZAK'),
      this.translate.instant('ANKETA'),
      this.translate.instant('DODAVANJE')
    ];
  }

  public getDataForAdministracijaExport(users: AdministracijaUser[]): any[][] {
    const dataToExport: any[][] = [];

    users.forEach(user => {
      dataToExport.push([
        user.PrezimeUsera,
        user.ImeUsera,
        user.LoginName,
        user.VrstaClanstvaNaziv,
        user.AdministratorDaNe ? true : false,
        user.Blokiran ? true : false,
        (user.Claims as UserClaims).Forum.Kategorija ? true : false,
        (user.Claims as UserClaims).Forum.Objava ? true : false,
        (user.Claims as UserClaims).Forum.Komentar ? true : false,
        (user.Claims as UserClaims).eBiblioteka.Kategorija ? true : false,
        (user.Claims as UserClaims).eBiblioteka.Datoteka ? true : false,
        (user.Claims as UserClaims).eBiblioteka.Komentar ? true : false,
        (user.Claims as UserClaims).Ankete.Predlozak ? true : false,
        (user.Claims as UserClaims).Ankete.Anketa ? true : false,
        (user.Claims as UserClaims).Obavijesti.Dodavanje ? true : false
      ]);
    });

    return dataToExport;
  }

  private styleHeaderModulLabelsAdministracija(modulLabelsCells: Cell[]): void {
    modulLabelsCells.forEach(cell => {
      cell.alignment = { horizontal: 'center' };

      cell.font = { bold: true };

      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'b3c6e0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  //#endregion
  public getTodaysDateForFileName(): string {
    const today = new Date();
    return today.getDate().toString() + (today.getMonth() + 1) + today.getFullYear() + today.getHours() + today.getMinutes();
  }
}
