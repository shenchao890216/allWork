import { login } from './_indexCommon';

$(function () {
  console.log('jquery')
})
console.log('index')

class Person {
  constructor (name) {
    this.name = name
  }

  sayName () {
    console.log(this.name)
  }
}

const p1 = new Person('scrd')

p1.sayName()

login('http://baidu.com')
