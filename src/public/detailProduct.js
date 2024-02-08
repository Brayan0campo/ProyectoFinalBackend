const socket = io();

document
  .getElementById("formAddProductInCart")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    const prodId = document.getElementById("id_prod").innerText;
    const quantityValue = document.getElementById("quantityValue").innerText;
    const email = document.getElementById("email").innerText;

    socket.emit("newProdInCart", {
      idProd: prodId,
      quantity: quantityValue,
      email,
    });
  });

socket.on("success", (data) => {
  Swal.fire({
    icon: "success",
    title: data,
    text: `El producto se ha agregado al carrito con éxito`,
    confirmButtonText: "Aceptar",
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "/current";
    }
  });
});
