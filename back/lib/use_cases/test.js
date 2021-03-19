import * as rx from 'rxjs'
import * as rxop from 'rxjs/operators/index.js'

import cf from '../utils/cf.js'

let testObservable

//  testObservable = new rx.Observable(async (subscriber) => {
//     while (true) {
//         // eslint-disable-next-line no-await-in-loop
//         await cf.sleep(Math.random() * 1000)
//         subscriber.next('hello')
//     }
// })


// testObservable = rx.interval(100)

// let start = Date.now()


// let testObservable1 = testObservable
//     .pipe(
//         rxop.skipWhile((x) => x < 20),
//         rxop.sampleTime(300),
//         rxop.take(101),
//         rxop.bufferCount(5),
//     ).subscribe({
//         next(x) {
//             console.log(x)
//         },
//         complete() {
//         // console.log(Date.now() - start)
//         },
//     })

