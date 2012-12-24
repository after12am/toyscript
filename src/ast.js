// node param must be object
// var AST = function(node) {
//     this.node = node;
//     this.nodes = [];
// }
// 
// // AST.prototype.type = function() {
// //     return this.node.kind;
// // }
// // 
// AST.prototype.add = function(node) {
//     if (typeof node == 'object') this.nodes.concat(node);
//     else this.nodes.push(node);
// }
// 
// AST.prototype.toString = function() {
//     // should be dynamically overridden.
// }
// 
// var Node = AST;