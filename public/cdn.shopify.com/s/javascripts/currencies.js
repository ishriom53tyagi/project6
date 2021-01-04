  var Currency = {
    rates: {"USD":1.0,"EUR":1.21941,"GBP":1.33874,"CAD":0.779274,"ARS":0.0120092,"AUD":0.760078,"BRL":0.192311,"CLP":0.00139904,"CNY":0.152841,"CYP":0.397899,"CZK":0.0465827,"DKK":0.163814,"EEK":0.0706676,"HKD":0.128968,"HUF":0.00336874,"ISK":0.00782906,"INR":0.0135882,"JMD":0.00697368,"JPY":0.00966845,"LVL":1.57329,"LTL":0.320236,"MTL":0.293496,"MXN":0.0503137,"NZD":0.716613,"NOK":0.116169,"PLN":0.27058,"SGD":0.752881,"SKK":21.5517,"SIT":175.439,"ZAR":0.0684584,"KRW":0.000909004,"SEK":0.120694,"CHF":1.12476,"TWD":0.0356662,"UYU":0.0236508,"MYR":0.246339,"BSD":1.0,"CRC":0.00164795,"RON":0.250305,"PHP":0.0207825,"AED":0.272294,"VEB":0.000100125,"IDR":7.0884e-05,"TRY":0.131842,"THB":0.0333272,"TTD":0.1471,"ILS":0.31039,"SYP":0.00194996,"XCD":0.370369,"COP":0.000284498,"RUB":0.0134654,"HRK":0.161336,"KZT":0.00238301,"TZS":0.0004312,"XPT":1025.27,"SAR":0.266667,"NIO":0.028677,"LAK":0.000107658,"OMR":2.60078,"AMD":0.00191362,"CDF":0.000507206,"KPW":0.00111111,"SPL":6.0,"KES":0.0091935,"ZWD":0.00276319,"KHR":0.00024811,"MVR":0.0649474,"GTQ":0.128176,"BZD":0.49593,"BYR":3.8759e-05,"LYD":0.74566,"DZD":0.00756436,"BIF":0.00051531,"GIP":1.33874,"BOB":0.145122,"XOF":0.00185898,"STD":4.93484e-05,"NGN":0.00263182,"PGK":0.285001,"ERN":0.0666667,"MWK":0.00129933,"CUP":0.0377358,"GMD":0.0193076,"CVE":0.0110584,"BTN":0.0135882,"XAF":0.00185898,"UGX":0.000274228,"MAD":0.111668,"MNT":0.000350867,"LSL":0.0684584,"XAG":25.8232,"TOP":0.4385,"SHP":1.33874,"RSD":0.0103791,"HTG":0.0140791,"MGA":0.000253812,"MZN":0.013403,"FKP":1.33874,"BWP":0.0924347,"HNL":0.0413528,"PYG":0.00014338,"JEP":1.33874,"EGP":0.0642517,"LBP":0.00066335,"ANG":0.559429,"WST":0.389001,"TVD":0.760078,"GYD":0.00476086,"GGP":1.33874,"NPR":0.00845299,"KMF":0.00247864,"IRR":2.37951e-05,"XPD":2339.46,"SRD":0.0706583,"TMM":5.71429e-05,"SZL":0.0684584,"MOP":0.125212,"BMD":1.0,"XPF":0.0102187,"ETB":0.0257739,"JOD":1.41044,"MDL":0.0580024,"MRO":0.00261124,"YER":0.00399371,"BAM":0.623476,"AWG":0.558659,"PEN":0.277017,"VEF":0.100125,"SLL":9.98663e-05,"KYD":1.21951,"AOA":0.0015379,"TND":0.372587,"TJS":0.0884956,"SCR":0.0466889,"LKR":0.0052676,"DJF":0.00561799,"GNF":0.000100045,"VUV":0.00920299,"SDG":0.0181437,"IMP":1.33874,"GEL":0.305782,"FJD":0.488302,"DOP":0.0172144,"XDR":1.44103,"MUR":0.0253173,"MMK":0.000739119,"LRD":0.00615397,"BBD":0.5,"ZMK":4.72545e-05,"XAU":1870.92,"VND":4.32236e-05,"UAH":0.0351521,"TMT":0.285714,"IQD":0.000841854,"BGN":0.623476,"KGS":0.0120192,"RWF":0.00100906,"BHD":2.65957,"UZS":9.54764e-05,"PKR":0.00623781,"MKD":0.019788,"AFN":0.0129603,"NAD":0.0684584,"BDT":0.0117863,"AZN":0.588236,"SOS":0.00173273,"QAR":0.274725,"PAB":1.0,"CUC":1.0,"SVC":0.114286,"SBD":0.1246,"ALL":0.00993109,"BND":0.752881,"KWD":3.27465,"GHS":0.17039,"ZMW":0.0472545,"XBT":27495.0,"NTD":0.0337206,"BYN":0.38759,"CNH":0.153387,"MRU":0.0261124,"STN":0.0493484,"VES":9.64873e-07,"MXV":0.32975},
    convert: function(amount, from, to) {
      return (amount * this.rates[from]) / this.rates[to];
    }
  };