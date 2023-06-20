import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'LoadManager';

  public valor = 0; // 32409.35;
  public prestacoes = 0; // 48;
  public juros: number | undefined = undefined; // 1.9775;
  public valorParcela: number | undefined = undefined;

  public parcelas: Parcela[] = [];

  // Totais
  public valorTotal = 0;
  public valorTotalPrestacoes = 0;
  public jurosEconomizado = 0;

  // Pendentes
  public parcelasPendentes = 0;
  public valorTotalPendentes = 0;
  public valorTotalPrestacoesPendentes = 0;
  public jurosEconomizadoPendente = 0;

  public limiteValorParcela = 0;

  public jurosChange(ev: any) {
    if (!this.juros) return;
    if (this.valor > 0 && this.prestacoes > 0 && this.juros > 0) {
      this.valorParcela = this.calcPrice(this.valor, this.prestacoes, this.juros);
      this.valorParcela = Math.round(this.valorParcela * 100) / 100
    }
  }

  public valorParcelaChange(ev: any) {
    if (!this.valorParcela) return;
    if (this.valorParcela > 0 && this.prestacoes > 0 && this.valor > 0) {
      this.juros = this.rate(this.prestacoes, -this.valorParcela, this.valor);
      this.juros = Math.round(this.juros * 10000) / 10000; // Deal with decimal place
      this.juros *= 100; // It's percent (i know, i could just remove the division above, but i decided to kept is like this to make more sense the operations)
    }
  }

  public calculate() {
    if (!this.valorParcela || ! this.juros) return;

    this.parcelas = [];

    const prestacaoConst = this.valorParcela; //this.calcPrice(this.valor, this.prestacoes, this.juros);
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

  public rate(periods: number, payment: number, present: number, future: number | undefined = undefined, type: number | undefined = undefined, guess: number | undefined = undefined) {
    guess = (guess === undefined) ? 0.01 : guess;
    future = (future === undefined) ? 0 : future;
    type = (type === undefined) ? 0 : type;
  
    // Set maximum epsilon for end of iteration
    var epsMax = 1e-10;
  
    // Set maximum number of iterations
    var iterMax = 10;
  
    // Implement Newton's method
    var y, y0, y1, x0, x1 = 0,
      f = 0,
      i = 0;
    var rate = guess;
    if (Math.abs(rate) < epsMax) {
      y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
    } else {
      f = Math.exp(periods * Math.log(1 + rate));
      y = present * f + payment * (1 / rate + type) * (f - 1) + future;
    }
    y0 = present + payment * periods + future;
    y1 = present * f + payment * (1 / rate + type) * (f - 1) + future;
    i = x0 = 0;
    x1 = rate;
    while ((Math.abs(y0 - y1) > epsMax) && (i < iterMax)) {
      rate = (y1 * x0 - y0 * x1) / (y1 - y0);
      x0 = x1;
      x1 = rate;
        if (Math.abs(rate) < epsMax) {
          y = present * (1 + periods * rate) + payment * (1 + rate * type) * periods + future;
        } else {
          f = Math.exp(periods * Math.log(1 + rate));
          y = present * f + payment * (1 / rate + type) * (f - 1) + future;
        }
      y0 = y1;
      y1 = y;
      ++i;
    }
    return rate;
}

  public recalculate(ev: any) {
    for (let i = 0; i < this.parcelas.length; i++) {
      if (this.parcelas[i].adiantadoEm != -1) {
        this.parcelas[i].baixado = false;
      }

      this.parcelas[i].adiantadoEm = -1;
      this.parcelas[i].totalPagar = 0;
    }

    for (let i = 0; i < this.parcelas.length; i++) {
      const cParcela = this.parcelas[i];
      if (cParcela.baixado) {
        //cParcela.totalPagar = null;
        //continue;
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

        cParcAdiant.baixado = cParcela.baixado;
      }

      // Set Total
      cParcela.totalPagar = total;
    }

    // Totais
    this.valorTotal = 0;
    this.valorTotalPrestacoes = 0;
    this.jurosEconomizado = 0
    for (let i = 0; i < this.parcelas.length; i++) {
      const cParcela = this.parcelas[i];

      this.valorTotalPrestacoes += cParcela.prestacao;

      if (cParcela.adiantadoEm == -1) {
        this.valorTotal += !!cParcela.totalPagar ? cParcela.totalPagar : 0;
      }
    }
    this.jurosEconomizado = this.valorTotalPrestacoes - this.valorTotal;

    // Parcelas Pendentes
    this.parcelasPendentes = 0;
    this.valorTotalPendentes = 0;
    this.valorTotalPrestacoesPendentes = 0;
    this.jurosEconomizadoPendente = 0
    for (let i = 0; i < this.parcelas.length; i++) {
      const cParcela = this.parcelas[i];

      if (!cParcela.baixado) {
        this.valorTotalPrestacoesPendentes += cParcela.prestacao;
      }

      if (cParcela.adiantadoEm == -1 && !cParcela.baixado) {
        this.parcelasPendentes++;
        this.valorTotalPendentes += !!cParcela.totalPagar ? cParcela.totalPagar : 0;
      }
    }
    this.jurosEconomizadoPendente = this.valorTotalPrestacoesPendentes - this.valorTotalPendentes;

  }

  public getXParcelasNAdiantadas(qtd: number, ignore: number = -1) {
    if (qtd == 0) return [];
    //
    const parcelasFound: Parcela[] = [];
    for (let i = this.parcelas.length - 1; i > 0; i--) {
      if (this.parcelas[i].adiantadoEm == -1 && !this.parcelas[i].baixado && this.parcelas[i].num > ignore) 
        parcelasFound.push(this.parcelas[i]);

      if (parcelasFound.length == qtd)
        break;
    }
    return parcelasFound;
  }

  // public getBaixadoAndAdiantado() {
  //   const cParcelasBaixadasList: any[] = [];
  //   //const cParcelasAdiantadasNumbersList = [];
  //   for (let i = 0; i < this.parcelas.length; i++) {
  //     const cParcela = this.parcelas[i];
  //     if (cParcela.baixado && cParcela.adiantadoEm == -1) {
  //       cParcelasBaixadasList.push(cParcela);
  //     }
  //     if (cParcela.)
  //   }
  //   return cParcelasBaixadasList;
  // }

  public resetQtds() {
    // Reset Adiantamento
    for (let i = 0; i < this.parcelas.length; i++) {
      const cParcela = this.parcelas[i];
      if (!cParcela.baixado) {
        cParcela.qtdAdiant = 0;
        cParcela.adiantadoEm = -1;
      }
    }
    this.recalculate(undefined);
  }

  public calculateAdiantamento() {
    this.resetQtds();
    
    // Iterate and check
    for (let i = 0; i < this.parcelas.length; i++) {
      const cParcela = this.parcelas[i];

      if (!cParcela.baixado && cParcela.adiantadoEm == -1) {
        //cParcela.qtdAdiant = 0;

        do {
          const found = this.getXParcelasNAdiantadas(1, cParcela.num);
          if (found.length == 0) break;
          if (cParcela.totalPagar == null) break;

          if (cParcela.totalPagar > this.limiteValorParcela) {
            cParcela.qtdAdiant -= 1;
            if (cParcela.qtdAdiant < 0)
              cParcela.qtdAdiant = 0;
            this.recalculate(undefined);
            break;
          }

          cParcela.qtdAdiant++;
          this.recalculate(undefined);

          if (cParcela.qtdAdiant > 99999) {
            alert("Erro calculando adiantamento!");
            return;
          }
        } while (true);
      }
    }

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