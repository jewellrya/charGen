let name = 'Game';
console.log(name);

// Cannot be a reserved keyword (if, let, else...)
// Should be meaningful
// Cannot start with a number (1name)
// Cannot contain space or hyphen
// Case-sensitive

const lastName = 'Project Prism'
console.log(lastName)

// Primitive Value Types:
let namee = 'Mosh'; // String Literal
let age = 30; // Number Literal
let isApproved = true; // Boolean Literal
let firstName; // undefined
let selectedColor = null; // You can clear the value of the variable.

// Reference Value Types:

// Person Object. Curly Braces are an "Object Literal". Contains one or more Key-Value pairs.
let person = {
  name: 'Game',
  age: 30
};

// Dot Notation
person.name = 'Game';

// Bracket Notation
let selection = 'name';
person[selection] = 'Mary';

// Array Object. Square Brackets are an "Array Literal".
let selectedColors = ['red', 'blue'];
selectedColors[2] = 'green';
console.log(selectedColors[0]);
console.log(selectedColors.length);

// FUNCTIONS
// Inside Curly Brackets is the Function Body
// name is the "Parameter" - Only accessable inside the function.
// This function is performing a task.
function greet(name, lastName) {
  console.log('Hello ' + name + ' ' + lastName);  // Statement Declared with semicolon.
}

greet('John', 'Smith'); // John is an "Argument"

// TYPES OF FUNCTIONS
// Previous was Performing a task
// Calculating a Value
function square(number) {
  return number * number;
}

// log is a function and we are passing a expression
console.log(square(2));




// OBJECT ORIENTED PROGRAMMING - OOP

// A single "Object" contains "property" and "method" - "Encapsulation"
// I.E. Car: properties="make, color, model". Method="start() stop() turn()"
// Inheritance - objects inherit properties and methods
// Polymorphism