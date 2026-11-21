/* (21-nov-2026, Iago: «no hay el botón para generar más… ¡debería estar!»)
   El dado (generar otra lección) se ve para TODOS los alumnos; «Prueba directa» sigue solo en las cuentas de Iago.
   estudio-comun.js (20-nov 16:21) escondía los dos a los alumnos y, en las cuentas de Iago, solo los enseñaba si la sesión
   cargaba en menos de 4 s (en el iPad a veces tarda más y desaparecían). Aquí: el dado siempre, y la marca de profe se
   sigue mirando durante un minuto. Deshacer: borrar la línea de dado.js en index.html. */
(function(){
  try{
    var st=document.createElement('style'); st.id='rpDadoTodos';
    st.textContent='#barActions #genBtn{display:inline-flex!important}';
    document.head.appendChild(st);
    var n=0, t=setInterval(function(){
      try{ if(typeof rpEsTesterCuenta==='function' && rpEsTesterCuenta()){ document.body.classList.add('lb-profe'); clearInterval(t); } }catch(e){}
      if(++n>60) clearInterval(t);
    },1000);
  }catch(e){}
})();
