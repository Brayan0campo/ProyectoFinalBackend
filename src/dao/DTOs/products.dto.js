export default class ProductsDTO {
  constructor(product) {
    this.description = product.description;
    this.image = product.image;
    this.price = product.price;
    this.stock = product.stock;
    this.category = product.category;
    this.availability = product.availability;
    this.owner = product.owner;
  }
}
