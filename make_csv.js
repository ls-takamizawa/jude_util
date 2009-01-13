/**
 * �e�[�u�������ꗗ�I�ȃV�[�g��ER���f���C���|�[�g�p������csv�ŏ����o���B
 *
 * �V�[�g���Ƃɕʃt�@�C���Ƃ��ďo��
 *
 * jruby�X�N���v�g���œ��{��t�@�C��������肭�����ł��ĂȂ��̂ŁA
 * �o�̓t�@�C�����z���v
 *
 * �u�b�N�ԂŃV�[�g�������Ԃ�Ə㏑�����ꂿ�Ⴄ
 *
 * cscript make_csv.js [options] ����xls...
 *
 * options:
 *   /out:�o�̓f�B���N�g��(default: .)
 *   /fs:�o��CSV�̃t�B�[���h�Z�p���[�^(default: ,)
 */

if(!WScript.FullName.match(/cscript\.exe$/i))
{
	WScript.echo("run me under cscript.exe");
	WScript.Quit();
}


function MakeCSV()
{
	this.initialize.apply(this, arguments);
}

MakeCSV.prototype = {
	/**
	 * ������
	 */
	initialize: function() 
	{
		this.fso = WScript.CreateObject("Scripting.FileSystemObject");
	},

	/**
	 * CSV��s���o��
	 *
	 * @param	st	�o�͐�e�L�X�g�X�g���[��
	 * @param	rec	��s���̏����l�߂��z��
	 * @param	fs	�o�͂̃t�B�[���h�Z�p���[�^
	 * @param	is_header	�w�b�_�s�o�͂��ǂ����������^�U�l
	 */
	out_rec: function(st, rec, fs, is_header)
	{
		var items = [];
		for(var i in rec)
		{
			var v = rec[i];
			if(v == undefined)
			{
				v = "";
			}
			// ���l���������
			v = v + "";
			
			// �w�b�_�s�}�[�N
			if(is_header && i == 0)
			{
				v = "#" + v;
			}
			
			// loose�ɃG�X�P�[�v�Ȃ�
			v = v.replace(/"/g, '""');
			items.push('"' + v + "\"");
		}

		st.WriteLine(items.join(fs));
	},

	/** 
	 * �G���e�B�e�B����o��
	 *
	 * @param	fn	�o�̓t�@�C����
	 * @param	ent	�G���e�B�e�B����̏����l�߂�hash
	 * @param	fs	�o��CSV�̃t�B�[���h�Z�p���[�^
	 */
	out_csv: function(fn, ent, fs)
	{
		var	st = this.fso.OpenTextFile(fn, 2, true);
		
		try {
			// �G���e�B�e�B�̏��
			this.out_rec(st, ["@entity", ent.logicalname, ent.physicalname], fs, true);
			
			// �w�b�_
			// �ŏ��̑����̎���key���w�b�_�Ƃ݂Ȃ��ď���
			// �Ȃ̂ŁA�����̂Ȃ��o�͂͗�O��
			var header = [];
			for(var k in ent.attributes[0])
			{
				header.push(k);
			}
			this.out_rec(st, header, fs, true);
			
			// �e����
			for(var i in ent.attributes)
			{
				var attr = ent.attributes[i];
			
				var rec = [];
				for(var i in header)
				{
					rec.push(attr[header[i]]);
				}
				this.out_rec(st, rec, fs, false);
			}

		} catch(ex) {
			throw	ex;
		} finally {
			st.Close();
		}
	},
	
	/**
	 * �V�[�g����o�͏���
	 * �V�[�g�̃��C�A�E�g����Bsamp1.xls��O��Ƃ����R�[�h
	 *
	 * @param	fn_out	�o�̓t�@�C����
	 * @param	sh		Worksheet�I�u�W�F�N�g
	 * @param	options	����I�v�V����
	 */
	do_sheet: function(fn_out, sh, options) 
	{
		var attrs = [];
		var ent = {
			logicalname: "",
			physicalname: "",
			attributes: attrs
		};
		
		// �e�[�u���̖��O
		ent.logicalname = sh.Cells(1, 2).Value;
		ent.physicalname = sh.Cells(2, 2).Value;
		
		// �e����
		for(var row = 5; ;row++)
		{
			// �_������undefined�Ȃ炨���܂�
			if(!sh.Cells(row, 1).Value)
			{
				break;
			}
			
			var attr = {
				logicalname: 	sh.Cells(row, 1).Value,
				physicalname: 	sh.Cells(row, 2).Value,
				domain: 		sh.Cells(row, 3).Value,
				type: 			sh.Cells(row, 4).Value,
				length: 		sh.Cells(row, 5).Value,
				pk: 			sh.Cells(row, 6).Value,
				nn: 			sh.Cells(row, 7).Value,
				"default": 		sh.Cells(row, 8).Value
			};
			
			attrs.push(attr);
		}
		
		// �o��
		this.out_csv(fn_out, ent, options.fs);
	},
	
	/**
	 * xls���
	 * �e�V�[�g���Ȃ߂�
	 * 
	 * @param	excel	�G�N�Z���A�v���P�[�V�����I�u�W�F�N�g
	 * @param	options	����I�v�V����
	 * @param	fn_xls	����xls�t�@�C����
	 */
	do_xls: function(excel, options, fn_xls) 
	{
		
		if(!this.fso.FolderExists(options.out))
		{
			this.fso.CreateFolder(options.out);
		}

		var book = excel.Workbooks.Open(fn_xls, true);
		
		try {
			for(var i = 1; i <= book.Sheets.Count; i++)
			{
				var sh = book.Sheets(i);
				var name = sh.Name + ".csv";
				var fn_out = this.fso.BuildPath(options.out, name);
				this.do_sheet(fn_out, sh, options);
			}
		} catch(ex) {
			throw ex;
		} finally {
			book.Close(false);
		}

	},
	
	/**
	 * main
	 * 
	 * @param	argv	WScript.Arguments
	 */
	main: function(argv) 
	{
		// �I�v�V����
		var opt = argv.Named;
		
		var options = {
			// �o�͐�t�H���_
			out: ".",
			// �o��CSV�̃t�B�[���h�Z�p���[�^
			fs: ","
		};
		
		if(opt.Item("fs"))
		{
			options.fs = opt.Item("fs") ;
		}
		if(opt.Item("out"))
		{
			options.out = opt.Item("out") ;
		}
		options.out = this.fso.GetAbsolutePathName(options.out);
		
		var	excel = new ActiveXObject("Excel.Application");
		
		try {
			excel.DisplayAlerts = false;

			// ����
			var args = argv.Unnamed;
			for(var i = 0; i < args.length; i++)
			{
				var fn_xls = this.fso.GetAbsolutePathName(args(i));
				if(!this.fso.FileExists(fn_xls))
				{
					WScript.echo("*** xls not not found: " + fn_xls);
					return false;
				}
				
				this.do_xls(excel, options, fn_xls);
			}
		} catch(ex) {
			throw ex;
		} finally {
			excel.Quit();
		}
	}
};

// --------------------------------------------------------------

var	app = new MakeCSV();
app.main(WScript.Arguments);




