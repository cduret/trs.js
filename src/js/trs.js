/* global Objects */
/* global Tests */
/* global Parser */

var Trs = (function() {

  //var VAR_REGEX = /^[a-zA-Z]\d*?_?$/;
  var VAR_REGEX = /^[A-Z]+[a-zA-Z\d]*?_?$/;

  // TODO make include with continuation
  //
  // math include
  // [math io] includes

  // TODO make unfying same variables on lhs of rules
  // so a rule like [x y x] test => x. [1 2 1] would match !

  // TODO rewrite rhs of rules with 0 arity native words (ie random so ops can be referential transparent)
  //
  // TODO make symbolic calculation of stack shuffling words
  // example :
  //   x 2 + b 6 / swap -    ( swap should check its operands if expr of arity n are in normal form should include the n arguments as well.. )
  //   b 6 / x 2 + -

  var NUM = function(arity) {
    return function(f) {
      return function() {
        var args = Array.prototype.slice.call(arguments, 0).map(function(x) {
          var _x = Number(x);
          if( isNaN(_x) ) {
            throw Error('arguments not a number');
          }
          return _x;
        });

        return f.apply(null, args.slice(0, arity));
      };
    };
  };

  // --------------------- native -------------------------------
  var native = {};

  native['+'] = NUM(2)(function(x, y) { return x+y; });
  native['*'] = NUM(2)(function(x, y) { return x*y; });
  native['-'] = NUM(2)(function(x, y) { return x-y; });
  native['/'] = NUM(2)(function(x, y) { return x/y; });
  (function(native) {
    var eq = function(x, y) { return x === y; };
    var neq = function(x, y) { return x !== y; };
    var gt = function(x, y) { return x > y; };
    var lt = function(x, y) { return x < y; };
    var ge = function(x, y) { return x >= y; };
    var le = function(x, y) { return x <= y; };
    var mod = NUM(2)(function(x, y) { return x % y; });
    native['='] = eq;
    native.eq = eq;
    native['<>'] = neq;
    native.neq = neq;
    native['>'] = gt;
    native.gt = gt;
    native['<'] = lt;
    native.lt = lt;
    native['>='] = ge;
    native.ge = ge;
    native['<='] = le;
    native.le = le;
    native['%'] = mod;
    native.mod = mod;
  })(native);
  native.abs = NUM(1)(Math.abs);
  native.acos = NUM(1)(Math.acos);
  native.asin = NUM(1)(Math.asin);
  native.atan = NUM(1)(Math.atan);
  native.atan2 = NUM(1)(Math.atan2);
  native.ceil = NUM(1)(Math.ceil);
  native.cos = NUM(1)(Math.cos);
  native.exp = NUM(1)(Math.exp);
  native.floor = NUM(1)(Math.floor);
  native.imul = NUM(1)(Math.imul);
  native.log = NUM(1)(Math.log);
  native.max = NUM(2)(Math.max);
  native.min = NUM(2)(Math.min);
  native.pow = NUM(2)(Math.pow);
  native.random = Math.random;
  native.round = NUM(1)(Math.round);
  native.sin = NUM(1)(Math.sin);
  native.sqrt = NUM(1)(Math.sqrt);
  native.tan = NUM(1)(Math.tan);

  var prelude = [
    'X Y + => native.',
    'X Y * => native.',
    'X Y - => native.',
    'X Y / => native.',
    'X Y = => native.',
    'X Y <> => native.',
    'X Y > => native.',
    'X Y < => native.',
    'X Y >= => native.',
    'X Y <= => native.',
    'X Y % => native.',
    'X Y eq => native.',
    'X Y neq => native.',
    'X Y gt => native.',
    'X Y lt => native.',
    'X Y ge => native.',
    'X Y le => native.',
    'X Y mod => native.',
    'X abs => native.',
    'X acos => native.',
    'X asin => native.',
    'X atan => native.',
    'X atan2 => native.',
    'X ceil => native.',
    'X cos => native.',
    'X exp => native.',
    'X floor => native.',
    'X imul => native.',
    'X log => native.',
    'X Y max => native.',
    'X Y min => native.',
    'X Y pow => native.',
    'random => native.',
    'X round => native.',
    'X sin => native.',
    'X sqrt => native.',
    'X tan => native.',
    '[X_] i => X_.',
    'X drop => .',
    'X pop => .',
    '2drop => drop drop.',
    '3drop => drop drop drop.',
    'X Y nip => Y.',
    'X Y Z 2nip => Z.',
    'X dup => X X.',
    'X Y 2dup => X Y X Y.',
    'X Y Z 3dup => X Y Z X Y Z.',
    'X Y over => X Y X.',
    'keep => over [i] dip.',
    'bi => [keep] dip i.',
    'tri => [[keep] dip keep] dip i.',
    'X Y Z 2over => X Y Z X Y.',
    'X Y Z pick => X Y Z X.',
    'X Y swap => Y X.',
    'X Q dip => Q i X.',
    'X Y Q 2dip => Q i X Y.',
    'X Y Z Q 3dip => Q i X Y Z.',
    'W X Y Z Q 4dip => Q i W X Y Z.',
    'X Y dupd => X X Y.',
    'X Y z rot => Y Z X.',
    'V [] Q step => V.',
    'V [M M_] Q step => V M Q i [M_] Q step.',
    '[] V Q fold => V.',
    '[M M_] V Q fold => [M_] V M Q i Q fold.',
    '[X Y_] first => X.',
    '[X Y_] rest => [Y_].',
    '[] length => 0.  [X Y_] length => 1 [Y_] length +.',
    'X [Y_] cons => [X Y_]. [X Y_] uncons => [Y_].',
    '[X_] V swons => [V X_].',
    'true [X_] [Y_] if => X_. false [X_] [Y_] if => Y_.',
    'false true and => false. true false and => false. false false and => false. true true and => true.',
    'false true or => true. true false or => true. false false or => false. true true or => true.',
    'M N [X_] range => M N = [[N X_]] [M N 1 - [N X_] range] if.',
    '[] P filter => []. [X Y_] P filter => X P i [X [Y_] P filter cons] [[Y_] P filter] if.',
    '[] Q map => [].',
    '[X Y_] Q map => X Q i [Y_] Q map cons.',
    'flatmap => map [i] map.'
  ].join('\n');

  // find if word expression inside dictionnary
  var arity = function(dic, word) {
    if( word !== undefined ) {
      var i;
      for(i=0;i<dic.length;i++) {
        if( dic[i].name === word ) {
          return [dic[i].arity, dic[i].index];
        }
      }
    }
    return [-1, -1];
  };

  // ---------------------- PARSE --------------------------------
  var parse_program = function(code, _prelude) {
    var parse_rules = function(rules) {
      var i, rules_out = [], dic = [];

      var get_prec = function(s) {
        return dic.filter(function(x) { return x.name === s; });
      };

      var get_var = function(lhs, s) {
        var i;
        for(i=0;i<lhs.length;i++) {
          if( lhs[i].program && get_var(lhs[i].program, s) ) {
            return true;
          } else if( lhs[i].variable && lhs[i].variable === s ) {
            return true;
          }
        }
        return false;
      };

      var make_lhs = function(dic, level, l) {
        return function(e, i) {
          if( e.expression && ( (level === 0 && i<(l-1)) || level > 0 ) &&
              VAR_REGEX.exec(e.expression) && get_prec(e.expression).length === 0 ) {
            return { variable: e.expression };
          } else if( e.program ) {
            return { program : e.program.map(make_lhs(dic, level+1, l)) };
          }
          return e;
        };
      };

      var make_rhs = function(dic, level, lhs) {
        return function(e) {
          if( e.expression && VAR_REGEX.exec(e.expression) &&
              get_prec(e.expression).length === 0 && get_var(lhs, e.expression) ) {
            return { variable: e.expression };
          } else if( e.program ) {
            return { program : e.program.map(make_rhs(dic, level+1, lhs)) };
          }
          return e;
        };
      };

      for(i=0;i<rules.length;i++) {
        if( rules[i].rule ) {
          var r = rules[i].rule;
          var lhs_len = r.lhs.length;
          if( lhs_len === 0 ) { continue; }
          var op = r.lhs[lhs_len-1];
          if( op.expression ) {
            var p = get_prec(op.expression);
            if( p.length === 1 ) {
              p[0].index = ((p[0].index instanceof Array)?p[0].index:[p[0].index]).concat(i);
            } else {
              dic.push({ name: op.expression, arity: lhs_len-1, index: i });
            }
          }
          var lhs = r.lhs.map(make_lhs(dic, 0, lhs_len));
          var rhs = r.rhs.map(make_rhs(dic, 0, lhs));
          rules_out.push([{program: lhs}, {program: rhs}]);
        }
      }

      return [rules_out, dic];
    };

    var pre = _prelude?prelude+'\n':'';
    var result = Parser.parse(pre+code);
    var prules = parse_rules(result.rules);
    var program = result.program;

    return {rules: prules[0], dic: prules[1], program: program};
  };

  var program_to_string = function(program) {
    var _render_program = function(term) {
      var i, out = [];
      if( term.program ) {
        out.push('[');
        for(i=0;i<term.program.length;i++) {
          out.push(_render_program(term.program[i]));
        }
        out.push(']');
      } else if( term.expression ) {
        out.push(term.expression);
      //} else if( term.op ) {
        //out.push(term.op);
      }
      return out.join(' ');
    };

    var m = /^\[\s*(.*?)\s*\]$/.exec(_render_program(program));
    return m?m[1]:'';
  };


  // ---------------- REWRITE -------------------------------------------

  var indom = function(x, s) {
    var i;
    for(i=0;i<s.length;i++) {
      if( s[i][0] === x ) {
        return true;
      }
    }
    return false;
  };

  var app = function(s, x) {
    var i;
    for(i=0;i<s.length;i++) {
      if( s[i][0] === x ) {
        return s[i][1];
      }
    }
  };

  // subst -> program -> program
  var lift = function(s, p) {
    if( p.program ) {
      return { program: p.program.reduce(function(acc, _p) { return acc.concat(lift(s, _p)); }, []) };
    } else if( p.variable ) {
      if( indom(p.variable, s) ) {
        return app(s, p.variable);
      } else {
        throw Error('happened already ?');
        //return p; // ??
      }
    } else {
      return p;
    }
  };

  var zip = function(a,b) {
    var i, result = [];
    for(i=0;i<a.length;i++) {
      result.push([a[i], b[i]]);
    }
    return result;
  };

  var zip_match = function(a_v, a_t) {
    var any = function(x) { return x.variable && /.*?_$/.exec(x.variable); };
    var not_any = function(x) { return x.variable && /.*?[^_]$/.exec(x.variable); };

    if( a_v.length > a_t.length ) {
      if( (any(a_v[0]) && a_t.length > 0) || a_v.length !== (a_t.length+1) || not_any(a_v[a_v.length-1]) ) {
        throw Error('UNIFY'); // ?
      }
    } else if( a_v.length === 0 && a_t.length > 0 ) {
      throw Error('UNIFY');
    }
    var distribution = function() {
      var nb_any = a_v.filter(any).length;
      var nb_var = a_v.filter(not_any).length;
      var elt_per_any = -1;
      var nb_rest = a_v.length - nb_any - nb_var;
      if( nb_any > 0 ) {
        elt_per_any = Math.floor((a_t.length-(a_v.length-nb_any))/nb_any);
      }
      return [nb_var, nb_any, elt_per_any, nb_rest];
    };
      
    var i, j = 0, d = distribution(), result = [];
    if( d[0] + d[1]*d[2] + d[3] !== a_t.length ) {
      throw Error('UNIFY');
    }
    for(i=0;i<a_v.length;i++) {
      if( a_v[i].expression || a_v[i].program ) {
        result.push([a_v[i], a_t[j++]]);
      } else if( any(a_v[i]) ) {
        result.push([a_v[i], a_t.slice(j, j+d[2])]);
        j += d[2];
      } else if( not_any(a_v[i]) ) {
        result.push([a_v[i], a_t[j++]]);
      }
    }
    return result;
  };

  // program -> program -> substitution
  var match = function(pat, obj) {
    var matchs = function(level, terms, s) {
      if( terms.length === 0 ) {
        return s;
      }
      var f, g, t, ts, us, x;
      if( terms[0][0].program && terms[0][1].program ) {
        if( level === 0 ) {
          f = terms[0][0].program[terms[0][0].program.length-1];
          ts = terms[0][0].program.slice(0, terms[0][0].program.length-1);
          g = terms[0][1].program[terms[0][1].program.length-1];
          us = terms[0][1].program.slice(0, terms[0][1].program.length-1);
          if( f.expression && g.expression && f.expression === g.expression ) {
            return matchs(level+1, zip(ts, us).concat(terms.slice(1)), s);
          } else {
            throw Error('UNIFY');
          }
        } else {
          return matchs(level+1, zip_match(terms[0][0].program, terms[0][1].program).concat(terms.slice(1)), s);
        }
      } else if( terms[0][0].variable ) {
        x = terms[0][0].variable;
        t = terms[0][1];
        if( indom(x, s) ) {
          if( app(s, x).expression === t.expression ) {
            return matchs(level+1, terms.slice(1), s);
          } else {
            throw Error('UNIFY');
          }
        } else {
          return matchs(level+1, terms.slice(1), s.concat([[x,t]])/*[[x,t]].concat(s)*/);
        }
      } else if( terms[0][1].variable ) {
        throw Error('UNIFY');
      } else if( terms[0][0].expression && terms[0][1].expression ) {
        f = terms[0][0].expression;
        g = terms[0][1].expression;
        if( f === g ) {
          return matchs(level+1, terms.slice(1), s);
        } else {
          throw Error('UNIFY');
        }
      } else {
        throw Error('UNIFY');
      }
    };
    return matchs(0, [[pat, obj]], []);
  };

  //  [{string, int}] -> [[program, program]] -> program -> program
  var rewrite = function(dic, rules, program, debug) {
    var a, i = 0, r, stack = [], result, new_p = program.program;

    var apply = function(r, p) {
      var s = match(r[0], p);
      if( r[1].program.length === 0 ) {
        return [];
      } else if( r[1].program[0].expression === 'native' ) {
        var args = s.map(function(x) { return x[1].expression; });
        var op = r[0].program[r[0].program.length-1].expression;
        try {
          return [{ expression: String(native[op].apply(null, args)) }];
        } catch(e) {
          throw Error('UNIFY');
        }
      } else {
        return lift(s, r[1]).program;
      }
    };

    result = program.program;

    if( debug) { console.debug('@ '+program_to_string({program: result})); }

    while(i<result.length) {
      if( result[i].expression ) {
        a = arity(dic, result[i].expression);
        if( a[0] >= 0 ) {
          if( i >= a[0] ) {
            if( a[1] instanceof Array ) { // multiple rules
              var j;
              for(j=0;j<a[1].length;j++) {
                r = rules[a[1][j]];
                try {
                  result = result.slice(0, i-a[0]).concat(
                    apply(r, {program : result.slice(i-a[0], i+1)})).concat(
                    result.slice(i+1));
                  if( debug) { console.debug('@ '+program_to_string({program: result})); }
                  i = 0;
                  break;
                } catch(e) {
                  if( e.message !== 'UNIFY' ) {
                    throw e;
                  } else if( j === (a[1].length-1) ) {
                    i++; //bunch of rules failed
                  }
                }
                //continue;
              }
            } else {
              r = rules[a[1]];
              try {
                result = result.slice(0, i-a[0]).concat(
                  apply(r, {program : result.slice(i-a[0], i+1)})).concat(
                  result.slice(i+1));
                if( debug) { console.debug('@ '+program_to_string({program: result})); }
                i = 0;
                //continue;
              } catch(e) {
                if( e.message !== 'UNIFY' ) {
                  throw e;
                } else {
                  i++;// rule failed
                }
              }
            }
          }  else { throw Error('Stack underflow !??'); }
        } else {
          i++;
        }
      } else {
        i++;
      }
    }

    return {program: result};
  };

  /*var reduce_ = function(code) {
    var pgm = parse_program(code);
    return program_to_string(rewrite(pgm.dic, pgm.rules, pgm));
  };

  var reducep_ = function(code) {
    var pgm = parse_program(code);
    return program_to_string(rewrite(pgm.dic, pgm.rules, pgm, true));
  };

  var reduce = function(code) {
    var pgm = parse_program(code, true);
    return program_to_string(rewrite(pgm.dic, pgm.rules, pgm));
  };

  var reducep = function(code) {
    var pgm = parse_program(code, true);
    return program_to_string(rewrite(pgm.dic, pgm.rules, pgm, true));
  };*/

  var mk_test = function(code, _prelude, debug) {
    var pre = _prelude || false;
    var deb = debug || false;
    return function() {
      var pgm = parse_program(code, pre);
      return program_to_string(rewrite(pgm.dic, pgm.rules, pgm, deb));
    };
  };

  var mk_tests = function(tests) {
    return tests.map(function(t) {
      return { body: mk_test(t[0], true, t[2]),
               expected: t[1]
             };
    });
  };

  var to_html = [
    '[html X_] to_html => <html> [X_] [to_html] flatmap i </html>.',
    '[head X_] to_html => [<head> [X_] [to_html] flatmap i </head>].',
    '[body X_] to_html => [<body> [X_] [to_html] flatmap i </body>].',
    '[div X_] to_html => [<div> [X_] [to_html] flatmap i </div>].',
    'X to_html => [X].'
  ].join('\n');

  Tests.assert_all('rewrite',
    mk_tests([
      ['X 0 + => X. 1 0 +', '1'],
      ['X 0 + => X. 18 0 + 1 0 +', '18 1'],
      ['X 0 + => X. 10 0 swap 0 +', '0 10'],
      ['X 0 + => X. [1 0 +]', '[ 1 0 + ]'],
      ['X0 0 + => X0. [1 0 +]', '[ 1 0 + ]'],
      ['X 0 + => X. [1 0 + 7]', '[ 1 0 + 7 ]'],
      ['X 0 + => X. [1 0 +] 7', '[ 1 0 + ] 7'],
      ['X 0 + => X. [[1 0 +]]', '[ [ 1 0 + ] ]'],
      ['X 0 + => X. [[1 0 +] 7]', '[ [ 1 0 + ] 7 ]'],
      ['X 0 + => X. [[1 0 +] 0 +]', '[ [ 1 0 + ] 0 + ]'],
      ['X 0 + => X. [[1 0 +] X +]', '[ [ 1 0 + ] X + ]'],
      ['X 0 + => X. X 1 * => X. [[1 0 +] 1 *]', '[ [ 1 0 + ] 1 * ]'],
      ['X 0 + => X. X => 144. Y 1 * => Y. X 0 1 * +', '144'],
      ['[4] i' , '4'],
      ['[4 2] i' , '4 2'],
      ['0 X + => X. X Y swap => Y X. [4] i 0 swap +', '4'],
      ['[1 2 3 4] first', '1'],
      ['[1 2 3 4] rest', '[ 2 3 4 ]'],
      ['[X_] toto => X_. [] toto', ''],
      ['[X] toto => X. [] toto', '[ ] toto'],
      ['[X_] foo => X_. [1 2 3] foo', '1 2 3'],
      ['[1 X_] foo => X_. [1 2 3] foo', '2 3'],
      ['[X_ 1 2 3] foo => X_. [1 2 3] foo', '[ 1 2 3 ] foo'],
      ['[1 2 3 X_] foo => X_. [1 2 3] foo', ''],
      ['[1 X 3] foo => X. [1 2 3] foo', '2'],
      ['[1 X_ 3] foo => X_. [1 2 3] foo', '2'],
      ['[X X_ 3] foo => X_. [1 2 3] foo', '2'],
      ['[X X_] foo => X_. [1 2 3] foo', '2 3'],
      ['[X 2 X_ 7] foo => X_. [1 2 3 4 5 6 7] foo', '3 4 5 6'],
      ['[] toto => 0. [1 2 3] toto', '[ 1 2 3 ] toto'],
      ['[] toto => 0. [] toto', '0'],
      ['[1 2 3 4 5 6 7 8 9 10] length', '10'],
      ['1 [1 2 3 4] uncons cons', '[ 1 2 3 4 ]'],
      ['12 2 <> [yes] [no] if', 'yes'],
      ['2 1 - => 1. 1 1 - => 0. 2 1 - 1 -', '0'],
      ['2 1 - => 1. 1 1 - => 0. 0 toto => 1. X toto => X 1 - toto. 2 toto', '1'],
      ['X 0 + => X. X => 77. X 0 + 78 +', '155'],
      ['0 fac => 1. X fac => X X 1 - fac *. 5 fac', '120'], // factorial
      ['Y 0 ack => Y 1 +.  0 X ack => 1 X 1 - ack.  Y X ack => Y 1 - X ack X 1 - ack. 3 3 ack', '61'], // ackermann function
      ['0 fib => 0. 1 fib => 1. N fib => N 1 - fib N 2 - fib +. 10 fib', '55'], // fibonnaci
      ['10 10 = 2 2 = and', 'true'],
      ['1 10 [] range', '[ 1 2 3 4 5 6 7 8 9 10 ]'],
      ['[] next_primes => []. [N T_] next_primes => N [T_] [N % 0 <>] filter next_primes cons. 2 10 [] range next_primes', '[ 2 3 5 7 ]'] // Sieve of Eratosthenes
    ])
  );


  return {
    reduce: function(code, options) {
      var _options = Objects.extend({prelude:true, debug:false}, options || {});

      var pgm = parse_program(code, _options.prelude);
      return program_to_string(rewrite(pgm.dic, pgm.rules, pgm, _options.debug));
    }
  };
})();
