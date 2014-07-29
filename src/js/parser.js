/* global Parsimmon */
/* global Tests */

// TODO essayer de faire marcher le = dans une expression !!

var Parser = (function() {

  var alt = Parsimmon.alt;
  var digit = Parsimmon.digit;
  var fail = Parsimmon.fail;
  var lazy = Parsimmon.lazy;
  var letter = Parsimmon.letter;
  var regx = Parsimmon.regex;
  var seq = Parsimmon.seq;
  var succeed = Parsimmon.succeed;
  var str = Parsimmon.string;
  var wspc = Parsimmon.whitespace;
  var owspc = Parsimmon.optWhitespace;

  var terms = [];

  var test = ['[] Q map => [] .',
              '[X Y_] Q map => X Q i [Y_] Q map cons .',
              'step1 => [ ["#two" [["rz" 360 1] ["tx" 300 1]]]',
              '           ["#one"  [["rz" 360 1] ["tx" 300 1]]] ] .',
              'step1 step2'];

  //var EXPR_REGEX = /^[^(\[|\]|=>|\s|\.|")]+/;
  //var EXPR_REGEX = /^(?:(?!=>)[^(\[|\]|\s|\;|")])+/;
  var EXPR_REGEX = /^[+-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?\b|^(?:(?!=>)[^(\[|\]|\s|\.|")])+/;
  var expression = regx(EXPR_REGEX).map(function(s) { return {expression: s}; });

  var STR_REGEX = /^".*?"/;
  var string = regx(STR_REGEX).map(function(s) { return {expression: s}; });

  var space_sep = function (parser) {
    var space_parser = regx(/^\s+/).then(parser).many();
    return seq(parser, space_parser).map(function(results) {
      return [results[0]].concat(results[1]);
    }).or(succeed([]));
  };

  var space_nonl_sep = function (parser) {
    var space_parser = regx(/^[^\S\n]+/).then(parser).many();
    return seq(parser, space_parser).map(function(results) {
      return [results[0]].concat(results[1]);
    }).or(succeed([]));
  };

  var program = seq(regx(/^\[\s*/m),space_sep(lazy(function() {
    return alt(string, expression, program);
  })), regx(/\s*?\]/m)).map(function(results) {
    return {program: results[1]};
  });

  var instr = alt(string, expression, program);

  var rule = seq(space_nonl_sep(instr), regx(/[^\S\n]+?=>\s+/), space_sep(instr), regx(/\s*\./)).map(function(result) {
    return {rule : {lhs: result[0], rhs: result[2] }};
  });

  var source = space_sep(alt(rule, instr)).map(function(result) {
    return { rules: result.filter(function(e) { return e.rule !== undefined; }),
             program: result.filter(function(e) { return e.rule === undefined; }) };
  });

  Tests.assert_all('parser tests', [
      { body : function() { return source.parse('[e]').value; },
        expected: {rules:[], program: [{program: [{expression: 'e'}]}]} },
      { body : function() { return source.parse(test[0]).value; },
        expected: {rules: [{rule:{ lhs:[{program: []}, {expression: 'Q'}, {expression: 'map'}],
                                     rhs:[{program: []}]}}], program: []} },
      { body: function() { return source.parse(test[1]).value; },
        expected: {rules: [{rule : {lhs : [{program: [{expression: 'X'}, {expression: 'Y_'}]}, {expression: 'Q'}, {expression: 'map'}],
                                      rhs: [{expression:'X'}, {expression:'Q'}, {expression: 'i'}, {program: [{expression: 'Y_'}]}, {expression :'Q'}, {expression: 'map'}, {expression: 'cons'}]}}], program: []}},
      { body: function() { return source.parse(test.slice(2,4).join('\n')).value; },
        expected: {rules: [{rule: {lhs: [{expression:'step1'}],
                                     rhs: [{program: [{program:[{expression:'"#two"'}, {program:[{program:[{expression:'"rz"'}, {expression:'360'}, {expression:'1'}]},
                                                                                                       {program:[{expression:'"tx"'}, {expression:'300'}, {expression:'1'}]}]}]},
                                           {program:[{expression:'"#one"'}, {program:[{program:[{expression:'"rz"'}, {expression:'360'}, {expression:'1'}]},
                                                                                          {program:[{expression:'"tx"'}, {expression:'300'}, {expression:'1'}]}]}]}]}]}}], program: []} },
      { body: function() { return source.parse(test.join('\n')).value; },
        expected: {rules: [{rule: {lhs: [{program:[]}, {expression:'Q'}, {expression:'map'}],
                                     rhs: [{program:[]}]}},
                             {rule: {lhs: [{program: [{expression:'X'}, {expression:'Y_'}]}, {expression:'Q'}, {expression:'map'}],
                                     rhs: [{expression:'X'}, {expression:'Q'}, {expression:'i'}, {program: [{expression:'Y_'}]}, {expression:'Q'}, {expression:'map'}, {expression:'cons'}]}},
                             {rule: {lhs: [{expression:'step1'}],
                                     rhs: [{program: [{program: [{expression:'"#two"'}, {program: [{program: [{expression:'"rz"'}, {expression:'360'}, {expression:'1'}]},
                                                                                                         {program: [{expression:'"tx"'}, {expression:'300'}, {expression:'1'}]}]}]},
                                                        {program: [{expression:'"#one"'}, {program: [{program: [{expression:'"rz"'}, {expression:'360'}, {expression:'1'}]},
                                                                                            {program: [{expression:'"tx"'}, {expression:'300'}, {expression:'1'}]}]}]}]}]}}],
                             program: [{expression:'step1'}, {expression:'step2'}]}}
    ]);

  return {
    parse: function(s) {
      return source.parse(s).value;
    }
  };
})();
