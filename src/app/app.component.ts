import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'LoadManager';

  public valor = 32409.35;
  public prestacoes = 48;
  public juros = 1.9775;

  public parcelas: Parcela[] = [];

  public parcelasRestantes = 0;
  public valorTotal = 0;
  public valorTotalPrestacoes = 0;
  public jurosEconomizado = 0

  public limiteValorParcela = 0;

  public calculate() {
    this.parcelas = [];

    const prestacaoConst = this.calcPrice(this.valor, this.prestacoes, this.juros);
    let cSaldo = this.valor;

    for (let i = 0; i < this.prestacoes; i++) {
      const cParcela = new Parcela();
      cParcela.juros = cSaldo * (this.juros / 100.0);
      cParcela.prestacao = prestacaoConst;
      cParcela.amortizacao = cParcela.prestacao - cParcela.juros;

      cSaldo -= cParcela.amortizacao;
      cParcela.saldo = cSaldo;
      cParcela.num = i + 1;
      this.parcelas.push(cParcela);
    }

    this.parcelas = this.parcelas.reverse();
    for (let i = 0; i < this.parcelas.length; i++) {
      this.parcelas[i].num = i + 1;
    }

    //

    this.recalculate(null);

  }

  public calcPrice(valor: number, prestacoes: number, juros: number) {
    let E, cont;
    juros = juros / 100.0;
    E = 1.0;
    cont = 1.0;

    for (let k = 1; k <= prestacoes; k++) {
      cont = cont * (1 + juros);
      E = E + cont;
    }
    E = E - cont;
    valor = valor * cont;

    return valor / E;
  }

  public recalculate(ev: any) {
    for (let i = 0; i < this.parcelas.length; i++) {
      this.parcelas[i].adiantadoEm = -1;
      this.parcelas[i].totalPagar = 0;
    }

    for (let i = 0; i < this.parcelas.length; i++) {
      const cParcela = this.parcelas[i];
      if (cParcela.baixado) {
        cParcela.totalPagar = null;
        continue;
      }
      if (cParcela.adiantadoEm != -1) {
        cParcela.totalPagar = null;
        continue;
      }

      // Total
      let total = cParcela.prestacao;
      
      // Adiantamento
      const parcelasAdiantar = this.getXParcelasNAdiantadas(cParcela.qtdAdiant);
      for (let cParcAdiant of parcelasAdiantar) {
        cParcAdiant.adiantadoEm = cParcela.num;
        cParcAdiant.totalPagar = null;
        total += cParcAdiant.amortizacao;
      }

      // Set Total
      cParcela.totalPagar = total;
    }

    // Parcelas
    this.parcelasRestantes = 0;
    this.valorTotal = 0;
    this.valorTotalPrestacoes = 0;
    this.jurosEconomizado = 0
    for (let i = 0; i < this.parcelas.length; i++) {
      const cParcela = this.parcelas[i];

      if (!cParcela.baixado) {
        this.valorTotalPrestacoes += cParcela.prestacao;
      }

      if (cParcela.adiantadoEm == -1 && !cParcela.baixado) {
        this.parcelasRestantes++;
        this.valorTotal += !!cParcela.totalPagar ? cParcela.totalPagar : 0;
      }
    }

    this.jurosEconomizado = this.valorTotalPrestacoes - this.valorTotal;

  }

  public getXParcelasNAdiantadas(qtd: number) {
    if (qtd == 0) return [];
    //
    const parcelasFound: Parcela[] = [];
    for (let i = this.parcelas.length - 1; i > 0; i--) {
      if (this.parcelas[i].adiantadoEm == -1 && !this.parcelas[i].baixado) 
        parcelasFound.push(this.parcelas[i]);

      if (parcelasFound.length == qtd)
        break;
    }
    return parcelasFound;
  }

  public calculateAdiantamento() {
    
    //for ()


  }

}

export class Parcela {
  // Calc
  public num: number = 0;
  public amortizacao: number = 0;
  public juros: number = 0;
  public prestacao: number = 0;
  public saldo: number = 0;

  // Prev Inp
  public baixado: boolean = false; // Pago Anteriormente / Ignorar nos adiantamentos
  public qtdAdiant = 0;

  // Prev Calc
  public adiantadoEm = -1; // Num da Parcela que adiantou Essa
  public totalPagar: number | null = 0;

}