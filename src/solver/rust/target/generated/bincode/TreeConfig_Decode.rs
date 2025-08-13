impl :: bincode :: Decode for TreeConfig
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    {
        Ok(Self
        {
            initial_state : :: bincode :: Decode :: decode(decoder) ?,
            starting_pot : :: bincode :: Decode :: decode(decoder) ?,
            effective_stack : :: bincode :: Decode :: decode(decoder) ?,
            rake_rate : :: bincode :: Decode :: decode(decoder) ?, rake_cap :
            :: bincode :: Decode :: decode(decoder) ?, flop_bet_sizes : ::
            bincode :: Decode :: decode(decoder) ?, turn_bet_sizes : ::
            bincode :: Decode :: decode(decoder) ?, river_bet_sizes : ::
            bincode :: Decode :: decode(decoder) ?, turn_donk_sizes : ::
            bincode :: Decode :: decode(decoder) ?, river_donk_sizes : ::
            bincode :: Decode :: decode(decoder) ?, add_allin_threshold : ::
            bincode :: Decode :: decode(decoder) ?, force_allin_threshold : ::
            bincode :: Decode :: decode(decoder) ?, merging_threshold : ::
            bincode :: Decode :: decode(decoder) ?,
        })
    }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for TreeConfig
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        Ok(Self
        {
            initial_state : :: bincode :: BorrowDecode ::
            borrow_decode(decoder) ?, starting_pot : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?, effective_stack : ::
            bincode :: BorrowDecode :: borrow_decode(decoder) ?, rake_rate :
            :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, rake_cap :
            :: bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            flop_bet_sizes : :: bincode :: BorrowDecode ::
            borrow_decode(decoder) ?, turn_bet_sizes : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?, river_bet_sizes : ::
            bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            turn_donk_sizes : :: bincode :: BorrowDecode ::
            borrow_decode(decoder) ?, river_donk_sizes : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?, add_allin_threshold : ::
            bincode :: BorrowDecode :: borrow_decode(decoder) ?,
            force_allin_threshold : :: bincode :: BorrowDecode ::
            borrow_decode(decoder) ?, merging_threshold : :: bincode ::
            BorrowDecode :: borrow_decode(decoder) ?,
        })
    }
}