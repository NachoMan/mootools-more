{
	tests: [
		{
			title: "Fx.Accordion",
			description: "Closes one as you open another.",
			verify: "When you click on headers do their contents display, hiding the previously visible item?",
			before: function(){
				new Fx.Accordion($$('dt'), $$('dd'));
			}
		}
	]
}