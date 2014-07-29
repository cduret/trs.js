#Term rewriting system with javascript#

simple concatenative language based on rewriting inspired from [CONCATENATIVE PROGRAMMING An Overlooked Paradigm in Functional Programming.pdf](https://github.com/papers-we-love/papers-we-love/blob/master/functional_programming/concatenative-programming-an-overlooked-paradigm.pdf?raw=true)

##install & play##
```
npm install
bower install
grunt
```

##Examples##
###factorial###
```
0 fac => 1.
X fac => X X 1 - fac *.

5 fac
120
```

###fibonacci###
```
0 fib => 0.
1 fib => 1.
N fib => N 1 - fib N 2 - fib +.

10 fib
55
```

###ackermann###
```
Y 0 ack => Y 1 +.
0 X ack => 1 X 1 - ack.
Y X ack => Y 1 - X ack X 1 - ack.

3 3 ack
61
```

###sieve of eratosthenes###
```
[] next_primes => [].
[N T_] next_primes => N [T_] [N % 0 <>] filter next_primes cons.

2 10 [] range next_primes
[ 2 3 5 7 ]
```
