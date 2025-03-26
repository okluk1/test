$(document).ready(function(){
	window.addEventListener("message",function(event){
		switch (event["data"]["action"]){
			case "showMenu":
				Backpack();
				$(".inventory").css("display","flex");
			break;

			case "hideMenu":
				$(".inventory").css("display","none");
				$(".ui-tooltip").hide();
			break;

			case "Backpack":
				Backpack();
			break;
		}
	});

	document.onkeyup = data => {
		if (data["key"] === "Escape"){
			$.post("http://inventory/invClose");
			$(".invRight").html("");
			$(".invLeft").html("");
		}
	};
});

const updateDrag = () => {
	$(".populated").draggable({
		helper: "clone"
	});

	$(".empty").droppable({
		hoverClass: "hoverControl",
		drop: function(event,ui){
			if(ui.draggable.parent()[0] == undefined) return;

			const shiftPressed = event.shiftKey;
			const origin = ui.draggable.parent()[0].className;
			if (origin === undefined) return;
			const tInv = $(this).parent()[0].className;

			if(origin === "invRight" && tInv === "invRight") return;
			
			itemData = { key: ui.draggable.data("item-key"), slot: ui.draggable.data("slot") };
			const target = $(this).data("slot");

			if (itemData.key === undefined || target === undefined) return;

			let amount = 0;
			let itemAmount = parseInt(ui.draggable.data("amount"));

			if (shiftPressed)
				amount = itemAmount;
			else if($(".amount").val() == "" | parseInt($(".amount").val()) <= 0)
				amount = 1;
			else
				amount = parseInt($(".amount").val());

			if(amount > itemAmount)
				amount = itemAmount;

			$(".populated, .empty, .use, .send, .deliver, .trash").off("draggable droppable");

			let clone1 = ui.draggable.clone();
			let slot2 = $(this).data("slot"); 

			if(amount == itemAmount) {
				let clone2 = $(this).clone();
				let slot1 = ui.draggable.data("slot");

				$(this).replaceWith(clone1);
				ui.draggable.replaceWith(clone2);
				
				$(clone1).data("slot", slot2);
				$(clone2).data("slot", slot1);
			} else {
				let newAmountOldItem = itemAmount - amount;
				let weight = parseFloat(ui.draggable.data("peso"));
				let newWeightClone1 = (amount*weight).toFixed(2);
				let newWeightOldItem = (newAmountOldItem*weight).toFixed(2);

				ui.draggable.data("amount",newAmountOldItem);

				clone1.data("amount",amount);

				$(this).replaceWith(clone1);
				$(clone1).data("slot",slot2);

				ui.draggable.children(".top").children(".itemAmount").html(formatarNumero(ui.draggable.data("amount")) + "x");
				ui.draggable.children(".top").children(".itemWeight").html(newWeightOldItem);
				
				$(clone1).children(".top").children(".itemAmount").html(formatarNumero(clone1.data("amount")) + "x");
				$(clone1).children(".top").children(".itemWeight").html(newWeightClone1);
			}

			updateDrag();

			if (origin === "invLeft" && tInv === "invLeft"){
				$.post("http://inventory/updateSlot",JSON.stringify({
					item: itemData.key,
					slot: itemData.slot,
					target: target,
					amount: parseInt(amount)
				}));
			} else if (origin === "invRight" && tInv === "invLeft"){
				const id = ui.draggable.data("id");
				$.post("http://inventory/pickupItem",JSON.stringify({
					id: id,
					target: target,
					amount: parseInt(amount)
				}));
			} else if (origin === "invLeft" && tInv === "invRight"){
				$.post("http://inventory/dropItem",JSON.stringify({
					item: itemData.key,
					slot: itemData.slot,
					amount: parseInt(amount)
				}));
			} else if (origin == "action" && tInv === "invRight" || tInv === "action" || tInv === "invLeft") {
				$.post("http://inventory/updateSlot",JSON.stringify({
					item: itemData.key,
					slot: itemData.slot,
					target: target,
					amount: parseInt(amount)
				}));
			}
			$(".amount").val("");
		}
	});

	$(".populated").droppable({
		hoverClass: "hoverControl",
		drop: function(event, ui) {
			if(ui.draggable.parent()[0] == undefined) return;
	
			const shiftPressed = event.shiftKey;
			const origin = ui.draggable.parent()[0].className;
			if (origin === undefined) return;
			const tInv = $(this).parent()[0].className;
	
			if(origin === "invRight" && tInv === "invRight") return;
	
			itemData = { key: ui.draggable.data("item-key"), slot: ui.draggable.data("slot") };
			let target = $(this).data("slot");
	
			if (itemData.key === undefined || target === undefined) return;
	
			// When an item is picked up from invRight, set target to slot 3
			if (origin === "invRight" && tInv === "invLeft") {
				target = 3; // Set target slot to 3
			}
	
			let amount = 0;
			let itemAmount = parseInt(ui.draggable.data("amount"));
	
			if (shiftPressed)
				amount = itemAmount;
			else if($(".amount").val() == "" || parseInt($(".amount").val()) <= 0)
				amount = 1;
			else
				amount = parseInt($(".amount").val());
	
			if(amount > itemAmount)
				amount = itemAmount;
	
			$(".populated, .empty, .use, .send, .deliver, .trash").off("draggable droppable");
	
			if(ui.draggable.data("item-key") == $(this).data("item-key")){
				let newSlotAmount = amount + parseInt($(this).data("amount"));
				let newSlotWeight = ui.draggable.data("peso") * newSlotAmount;
	
				$(this).data("amount",newSlotAmount);
				$(this).children(".top").children(".itemAmount").html(formatarNumero(newSlotAmount) + "x");
				$(this).children(".top").children(".itemWeight").html(newSlotWeight.toFixed(2));
	
				if(amount == itemAmount) {
					ui.draggable.replaceWith(`<div class="item empty" data-slot="${ui.draggable.data("slot")}"></div>`);
				} else {
					let newMovedAmount = itemAmount - amount;
					let newMovedWeight = parseFloat(ui.draggable.data("peso")) * newMovedAmount;
	
					ui.draggable.data("amount",newMovedAmount);
					ui.draggable.children(".top").children(".itemAmount").html(formatarNumero(newMovedAmount) + "x");
					ui.draggable.children(".top").children(".itemWeight").html(newMovedWeight.toFixed(2));
				}
			} else {
				if (origin === "invRight" && tInv === "invLeft") return;
	
				let clone1 = ui.draggable.clone();
				let clone2 = $(this).clone();
	
				let slot1 = ui.draggable.data("slot");
				let slot2 = $(this).data("slot");
	
				ui.draggable.replaceWith(clone2);
				$(this).replaceWith(clone1);
	
				$(clone1).data("slot", slot2);
				$(clone2).data("slot", slot1);
			}
	
			updateDrag();
	
			// Post request adjustments
			if (origin === "invLeft" && tInv === "invLeft") {
				$.post("http://inventory/updateSlot", JSON.stringify({
					item: itemData.key,
					slot: itemData.slot,
					target: target,
					amount: parseInt(amount)
				}));
			} else if (origin === "invRight" && tInv === "invLeft") {
				const id = ui.draggable.data("id");
				$.post("http://inventory/pickupItem", JSON.stringify({
					id: id,
					target: target, // This will place the item in slot 3
					amount: parseInt(amount)
				}));
			} else if (origin === "invLeft" && tInv === "invRight") {
				$.post("http://inventory/dropItem", JSON.stringify({
					item: itemData.key,
					slot: itemData.slot,
					amount: parseInt(amount)
				}));
			} else if (origin == "action" && tInv === "invRight" || tInv === "action" || tInv === "invLeft") {
				$.post("http://inventory/updateSlot", JSON.stringify({
					item: itemData.key,
					slot: itemData.slot,
					target: target,
					amount: parseInt(amount)
				}));
			}
	
			$(".amount").val("");
		}
	});
	

	$(".use").droppable({
		hoverClass: "hoverControl",
		drop: function(event,ui){
			if(ui.draggable.parent()[0] == undefined) return;

			const shiftPressed = event.shiftKey;
			const origin = ui.draggable.parent()[0].className;
			if (origin === undefined || origin === "invRight") return;
			itemData = { key: ui.draggable.data("item-key"), slot: ui.draggable.data("slot") };

			if (itemData.key === undefined) return;

			let amount = $(".amount").val();
			if (shiftPressed) amount = ui.draggable.data("amount");

			$.post("http://inventory/useItem",JSON.stringify({
				slot: itemData.slot,
				amount: parseInt(amount)
			}));

			$(".amount").val("");
		}
	});

	$(".send").droppable({
		hoverClass: "hoverControl",
		drop: function(event,ui){
			if(ui.draggable.parent()[0] == undefined) return;

			const shiftPressed = event.shiftKey;
			const origin = ui.draggable.parent()[0].className;
			if (origin === undefined || origin === "invRight") return;
			itemData = { key: ui.draggable.data("item-key"), slot: ui.draggable.data("slot") };

			if (itemData.key === undefined) return;

			let amount = $(".amount").val();
			if (shiftPressed) amount = ui.draggable.data("amount");

			$.post("http://inventory/sendItem",JSON.stringify({
				slot: itemData.slot,
				amount: parseInt(amount)
			}));

			$(".amount").val("");
		}
	});

	$(".deliver").droppable({
		hoverClass: "hoverControl",
		drop: function(event,ui){
			if(ui.draggable.parent()[0] == undefined) return;

			const shiftPressed = event.shiftKey;
			const origin = ui.draggable.parent()[0].className;
			if (origin === undefined || origin === "invRight") return;
			itemData = { key: ui.draggable.data("item-key"), slot: ui.draggable.data("slot") };

			if (itemData.key === undefined) return;

			let amount = $(".amount").val();
			if (shiftPressed) amount = ui.draggable.data("amount");

			$.post("http://inventory/Deliver",JSON.stringify({
				slot: itemData.slot
			}));

			$(".amount").val("");
		}
	});

	$(".trash").droppable({
		hoverClass: "hoverControl",
		drop: function(event,ui){
			if(ui.draggable.parent()[0] == undefined) return;

			const shiftPressed = event.shiftKey;
			const origin = ui.draggable.parent()[0].className;
			if (origin === undefined || origin === "invRight") return;
			itemData = { key: ui.draggable.data("item-key"), slot: ui.draggable.data("slot") };

			if (itemData.key === undefined) return;

			let amount = $(".amount").val();
			if (shiftPressed) amount = ui.draggable.data("amount");

			$.post("http://inventory/Trash",JSON.stringify({
				slot: itemData.slot,
				amount: parseInt(amount)
			}));

			$(".amount").val("");
		}
	});

	$(".populated").on("auxclick", e => {
		if (e["which"] === 3){
			const item = e["target"];
			const shiftPressed = event.shiftKey;
			const origin = $(item).parent()[0].className;
			if (origin === undefined || origin === "invRight") return;

			itemData = { key: $(item).data("item-key"), slot: $(item).data("slot") };

			if (itemData.key === undefined) return;

			let amount = $(".amount").val();
			if (shiftPressed) amount = $(item).data("amount");

			$.post("http://inventory/useItem",JSON.stringify({
				slot: itemData.slot,
				amount: parseInt(amount)
			}));
		}
	});

	$(".populated").tooltip({
		create: function(event,ui){
			var max = $(this).attr("data-max");
			var name = $(this).attr("data-name-key");
			var Vehkey = $(this).attr("data-Vehkey");
			var economy = $(this).attr("data-economy");
			var Suitcase = $(this).attr("data-Suitcase");
			var description = $(this).attr("data-description");
			var contents = `<item>${name}</item>${description !== "false" ? "<br><description>"+description+"</description>":""}<br><legenda>${Vehkey !== "undefined" ? "Placa: <r>"+ Vehkey +"</r>":`Economia: <r>$${economy}</r>`} <s>|</s> Máximo: <r>${max !== "false" ? max:"S/L"}</r></legenda>`;

			if (Suitcase !== "undefined"){
				contents = `<item>${name}</item><br><description>Contém <green>$${Suitcase}</green> dólares em espécie.</description><br><legenda>Economia: <r>$${economy}</r> <s>|</s> Máximo: <r>${max !== "false" ? max:"S/L"}</r></legenda>`;
			}

			if (name == "Passaporte" || name == "Distintivo"){
				var idName = $(this).attr("data-idName");
				var idBlood = $(this).attr("data-idBlood");
				var Passport = $(this).attr("data-Passport");
				var idVality = $(this).attr("data-idVality");
				var idPremium = $(this).attr("data-idPremium");
				var idRolepass = $(this).attr("data-idRolepass");
				var idGemstone = $(this).attr("data-idGemstone");

				contents = `<item>${name} - ${Passport}</item>${description !== "false" ? "<br><description>"+description+"</description>":""}<br><legenda>Nome: <r>${idName}</r><br>Tipo Sangüineo: <r>${idBlood}</r><br>Rolepass: <r>${idRolepass}</r><br>Diamantes: <r>${idGemstone}</r><br>Premium: <r>${idPremium}</r></legenda>`;

			}

			$(this).tooltip({
				content: contents,
				position: { my: "center top+10", at: "center bottom", collision: "flipfit" },
				show: { duration: 10 },
				hide: { duration: 10 }
			});
		}
	});
}

const colorPicker = (percent) => {
	var colorPercent = "#ffffff";

	if (percent >= 100)
		colorPercent = "rgba(255,255,255,0)";

	if (percent >= 51 && percent <= 75)
		colorPercent = "#fcc458";

	if (percent >= 26 && percent <= 50)
		colorPercent = "#fc8a58";

	if (percent <= 25)
		colorPercent = "#fc5858";

	return colorPercent;
}

const Backpack = () => {
	$.post("http://inventory/requestInventory", JSON.stringify({}), (data) => {
		$("#weightTextLeft").html(`${(data["invPeso"]).toFixed(2)}   /   ${ (data["invMaxpeso"]).toFixed(2)}`);

		$("#weightBarLeft").html(`<div id="weightContent" style="width: ${data["invPeso"] / data["invMaxpeso"] * 100}%"></div>`);

		$(".invLeft").html("");
		$(".invRight").html("");
		$(".action").html("");

		if (data["invMaxpeso"] > 100)
			data["invMaxpeso"] = 100;

		const nameList2 = data["drop"].sort((a, b) => (a["name"] > b["name"]) ? 1 : -1);

		for (let x = 1; x <= data["invMaxpeso"]; x++) {
			const slot = x.toString();

			if (data["inventario"][slot] !== undefined) {
				var v = data["inventario"][slot];
				var maxDurability = 86400 * v["days"];
				var newDurability = (maxDurability - v["durability"]) / maxDurability;
				var actualPercent = newDurability * 100;

				if (v["charges"] !== undefined)
					actualPercent = v["charges"];

				if (actualPercent <= 1)
					actualPercent = 1;

				const item = `<div class="item populated" 
				data-max="${v["max"]}" 
				data-economy="${v["economy"]}" 
				data-description="${v["desc"]}" 
				style="background-image: url('nui://vrp/config/inventory/${v["index"]}.png'); background-position: center; background-repeat: no-repeat;" 
				data-amount="${v["amount"]}" 
				data-peso="${v["peso"]}" 
				data-item-key="${v["key"]}" 
				data-name-key="${v["name"]}" 
				data-slot="${slot}" 
				data-idName="${v["idName"]}" 
				data-idBlood="${v["idBlood"]}" 
				data-idPremium="${v["idPremium"]}" 
				data-idVality="${v["idVality"]}" 
				data-idRolepass="${v["idRolepass"]}" 
				data-idGemstone="${v["idGemstone"]}" 
				data-Suitcase="${v["Suitcase"]}" 
				data-Vehkey="${v["Vehkey"]}" 
				data-Passport="${v["Passport"]}">
				<div class="top">
					<div class="itemWeight">${(v["peso"] * v["amount"]).toFixed(2)}</div>
					<div class="itemAmount">${formatarNumero(v["amount"])}x</div>
				</div>
				<div class="durability" style="width: ${actualPercent == 1 ? '100' : actualPercent}%; background: ${actualPercent == 1 ? '#fc5858' : colorPicker(actualPercent)};"></div>
				<div class="nameItem">${v["name"]}</div>
				<!-- Adicionando número de slot -->
				<div class="slotNumber">${slot}</div>
			</div>`;
			
			

				if (slot <= 5) {
					$(".action").append(item);
				} else {
					$(".invLeft").append(item);
				}
			} else {
				// SVG para slots vazios
				const emptySlot = `<div class="item empty" data-slot="${slot}">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<circle cx="10" cy="10" r="8" />
										<path d="M10 6v4" />
										<path d="M10 14h.01" />
									</svg>
								  </div>`;

				if (slot <= 5) {
					$(".action").append(emptySlot);
				} else {
					$(".invLeft").append(emptySlot);
				}
			}
		}

		for (let x = 1; x <= 20; x++) {
			const slot = x.toString();
		
			if (nameList2[x - 1] !== undefined) {
				var v = nameList2[x - 1];
				var maxDurability = 86400 * v["days"];
				var newDurability = (maxDurability - v["durability"]) / maxDurability;
				var actualPercent = newDurability * 100;
		
				if (v["charges"] !== undefined) actualPercent = v["charges"];
		
				if (actualPercent <= 1) actualPercent = 1;
		
				// Elemento de item com visual aprimorado
				const item = `<div class="item populated" style="background-image: url('nui://vrp/config/inventory/${v["index"]}.png'); background-position: center; background-repeat: no-repeat;" data-item-key="${v["key"]}" data-id="${v["id"]}" data-amount="${v["amount"]}" data-peso="${v["peso"]}" data-slot="${slot}">
					<div class="top">
						<div class="itemWeight" style="font-size: 14px; font-weight: 600; color: #f8f8f8;">${(v["peso"] * v["amount"]).toFixed(2)}kg</div>
						<div class="itemAmount" style="font-size: 14px; font-weight: 500; color: #f8f8f8;">${formatarNumero(v["amount"])}x</div>
					</div>
		
					<!-- Barra de Durabilidade -->
					<div class="durability" style="width: ${actualPercent == 1 ? '100' : actualPercent}%; background: ${actualPercent == 1 ? '#fc5858' : colorPicker(actualPercent)};"></div>
		
					<!-- Nome do item -->
					<div class="nameItem" style="font-size: 16px; font-weight: 700; color: #fff; text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.6);">${v["name"]}</div>
				</div>`;
		
				$(".invRight").append(item);
			} else {
				// Elemento vazio quando não há item
				const item = `<div class="item empty" data-slot="${slot}"></div>`;
				$(".invRight").append(item);
			}
		}
		
		updateDrag();
	});
}
/* ----------CRAFT---------- */
$(document).on("click",".craft",function(e){
	$.post("http://inventory/Craft");
});
/* ----------FORMATARNUMERO---------- */
const formatarNumero = n => {
	var n = n.toString();
	var r = "";
	var x = 0;

	for (var i = n["length"]; i > 0; i--) {
		r += n.substr(i - 1, 1) + (x == 2 && i != 1 ? "." : "");
		x = x == 2 ? 0 : x + 1;
	}

	return r.split("").reverse().join("");
}